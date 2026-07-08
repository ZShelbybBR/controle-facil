import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { exportToPDF } from '@/lib/exportPdf';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  FileDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  parseISO,
  isWithinInterval,
  getDay,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Colors ───────────────────────────────────────────────────────────────────
const COLORS = {
  income: '#10B981',
  expense: '#EF4444',
  balance: '#6366F1',
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  muted: '#94A3B8',
  chart: [
    '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#A855F7',
  ],
};

const DAY_NAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

type ReportTab = 'weekly' | 'monthly' | 'annual';

// ── Helper: get date range for a tab + period ────────────────────────────────
function getDateRange(tab: ReportTab, referenceDate: Date) {
  switch (tab) {
    case 'weekly':
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
      };
    case 'monthly':
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      };
    case 'annual':
      return {
        start: startOfYear(referenceDate),
        end: endOfYear(referenceDate),
      };
  }
}

// ── Helper: filter transactions by date range and optional category ───────────
function filterTransactions(
  transactions: ReturnType<typeof useTransactions>['transactions'],
  start: Date,
  end: Date,
  categoryId?: string,
) {
  return transactions.filter((t) => {
    const tDate = parseISO(t.date);
    const inRange = isWithinInterval(tDate, { start, end });
    const matchCategory = !categoryId || t.category_id === categoryId;
    return inRange && matchCategory;
  });
}

// ── Compute weekly data ──────────────────────────────────────────────────────
function computeWeeklyData(transactions: ReturnType<typeof useTransactions>['transactions'], start: Date) {
  const days = eachDayOfInterval({
    start,
    end: endOfWeek(start, { weekStartsOn: 1 }),
  });

  return days.map((day) => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      const tDate = parseISO(t.date);
      if (
        tDate.getFullYear() === day.getFullYear() &&
        tDate.getMonth() === day.getMonth() &&
        tDate.getDate() === day.getDate()
      ) {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      }
    }
    return {
      name: format(day, 'EEE dd/MM', { locale: ptBR }),
      dayShort: DAY_NAMES_PT[getDay(day)],
      income,
      expense,
      balance: income - expense,
    };
  });
}

// ── Compute monthly category breakdown ───────────────────────────────────────
function computeCategoryBreakdown(transactions: ReturnType<typeof useTransactions>['transactions']) {
  const categoryMap = new Map<string, { name: string; icon: string; color: string; total: number }>();
  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    totalExpenses += t.amount;
    const existing = categoryMap.get(t.category_id);
    if (existing) {
      existing.total += t.amount;
    } else {
      categoryMap.set(t.category_id, {
        name: t.category?.name ?? 'Sem categoria',
        icon: t.category?.icon ?? '📋',
        color: t.category?.color ?? '#6B7280',
        total: t.amount,
      });
    }
  }

  const breakdown: Array<{
    category_id: string;
    name: string;
    icon: string;
    color: string;
    total: number;
    percentage: number;
  }> = [];

  for (const [categoryId, data] of categoryMap.entries()) {
    breakdown.push({
      category_id: categoryId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      total: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    });
  }

  return breakdown.sort((a, b) => b.total - a.total);
}

// ── Compute annual monthly data ──────────────────────────────────────────────
function computeAnnualData(transactions: ReturnType<typeof useTransactions>['transactions'], year: number) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return months.map((month) => {
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const tDate = parseISO(t.date);
      if (isWithinInterval(tDate, { start: mStart, end: mEnd })) {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      }
    }

    return {
      month: MONTH_NAMES_PT[month.getMonth()],
      monthIndex: month.getMonth(),
      income,
      expense,
      balance: income - expense,
    };
  });
}

// ── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(
  data: Array<Record<string, string | number>>,
  filename: string,
) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = String(val ?? '');
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(','),
    ),
  ];
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Summary Card Component ───────────────────────────────────────────────────
function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-bold" style={{ color }}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <BarChart3 className="mb-3 h-12 w-12 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function ReportsPage() {
  const {
    transactions,
    loading: transactionsLoading,
    fetchTransactions,
  } = useTransactions();
  const {
    categories: _categories,
    loading: categoriesLoading,
    fetchCategories,
  } = useCategories();

  const [activeTab, setActiveTab] = useState<ReportTab>('monthly');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  const loading = transactionsLoading || categoriesLoading;

  // ── Date range ────────────────────────────────────────────────────────────
  const dateRange = useMemo(
    () => getDateRange(activeTab, referenceDate),
    [activeTab, referenceDate],
  );

  // ── Filtered transactions ────────────────────────────────────────────────
  const filteredTransactions = useMemo(
    () =>
      filterTransactions(
        transactions,
        dateRange.start,
        dateRange.end,
        selectedCategoryId === 'all' ? undefined : selectedCategoryId,
      ),
    [transactions, dateRange.start, dateRange.end, selectedCategoryId],
  );

  // ── All transactions for category filter (unfiltered by date for dropdown) ─
  const expenseCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ id: string; name: string; icon: string }> = [];
    for (const t of transactions) {
      if (t.type === 'expense' && !seen.has(t.category_id)) {
        seen.add(t.category_id);
        result.push({
          id: t.category_id,
          name: t.category?.name ?? 'Sem categoria',
          icon: t.category?.icon ?? '📋',
        });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      const delta = direction === 'prev' ? -1 : 1;
      setReferenceDate((prev) => {
        switch (activeTab) {
          case 'weekly':
            return delta > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1);
          case 'monthly':
            return delta > 0 ? addMonths(prev, 1) : subMonths(prev, 1);
          case 'annual':
            return delta > 0 ? addYears(prev, 1) : subYears(prev, 1);
        }
      });
    },
    [activeTab],
  );

  // ── Period label ──────────────────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    switch (activeTab) {
      case 'weekly': {
        const ws = startOfWeek(referenceDate, { weekStartsOn: 1 });
        const we = endOfWeek(referenceDate, { weekStartsOn: 1 });
        return `${format(ws, 'dd/MM')} – ${format(we, 'dd/MM/yyyy')}`;
      }
      case 'monthly':
        return format(referenceDate, 'MMMM yyyy', { locale: ptBR });
      case 'annual':
        return format(referenceDate, 'yyyy');
    }
  }, [activeTab, referenceDate]);

  // ── Weekly computation ────────────────────────────────────────────────────
  const weeklyData = useMemo(
    () => computeWeeklyData(filteredTransactions, dateRange.start),
    [filteredTransactions, dateRange.start],
  );

  const weeklySummary = useMemo(() => {
    const totalSpent = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const activeDays = weeklyData.filter((d) => d.expense > 0 || d.income > 0).length;
    const avgPerDay = activeDays > 0 ? totalSpent / 7 : 0;
    const highestDay = weeklyData.reduce(
      (max, d) => (d.expense > max.expense ? d : max),
      weeklyData[0] ?? { day: '-', expense: 0 },
    );
    return { totalSpent, totalIncome, avgPerDay, highestDay, balance: totalIncome - totalSpent };
  }, [filteredTransactions, weeklyData]);

  // ── Monthly computation ───────────────────────────────────────────────────
  const monthlyCategoryData = useMemo(
    () => computeCategoryBreakdown(filteredTransactions),
    [filteredTransactions],
  );

  const monthlySummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    }
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, balance, savingsRate };
  }, [filteredTransactions]);

  const pieData = useMemo(
    () => [
      { name: 'Receitas', value: monthlySummary.totalIncome, color: COLORS.income },
      { name: 'Despesas', value: monthlySummary.totalExpense, color: COLORS.expense },
    ],
    [monthlySummary],
  );

  // ── Annual computation ────────────────────────────────────────────────────
  const year = referenceDate.getFullYear();
  const annualData = useMemo(
    () => computeAnnualData(transactions, year),
    [transactions, year],
  );

  const annualSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let bestMonth = annualData[0];
    let worstMonth = annualData[0];

    for (const m of annualData) {
      totalIncome += m.income;
      totalExpense += m.expense;
      if (m.balance > (bestMonth?.balance ?? -Infinity)) bestMonth = m;
      if (m.balance < (worstMonth?.balance ?? Infinity)) worstMonth = m;
    }

    const hasData = totalIncome > 0 || totalExpense > 0;
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      bestMonth: hasData ? bestMonth : null,
      worstMonth: hasData ? worstMonth : null,
    };
  }, [annualData]);

  // ── CSV Export Handlers ───────────────────────────────────────────────────
  const exportWeeklyCSV = useCallback(() => {
    const data = weeklyData.map((d) => ({
      Dia: d.dayShort,
      Data: d.name,
      Receitas: d.income.toFixed(2),
      Despesas: d.expense.toFixed(2),
      Saldo: d.balance.toFixed(2),
    }));
    exportCSV(data, `relatorio-semanal-${format(referenceDate, 'yyyy-MM-dd')}`);
  }, [weeklyData, referenceDate]);

  const exportMonthlyCSV = useCallback(() => {
    const data = monthlyCategoryData.map((c) => ({
      Categoria: `${c.icon} ${c.name}`,
      Total: c.total.toFixed(2),
      Percentual: `${c.percentage.toFixed(1)}%`,
    }));
    exportCSV(data, `relatorio-mensal-${format(referenceDate, 'yyyy-MM')}`);
  }, [monthlyCategoryData, referenceDate]);

  const exportAnnualCSV = useCallback(() => {
    const data = annualData.map((m) => ({
      Mês: m.month,
      Receitas: m.income.toFixed(2),
      Despesas: m.expense.toFixed(2),
      Saldo: m.balance.toFixed(2),
    }));
    exportCSV(data, `relatorio-anual-${year}`);
  }, [annualData, year]);

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const exportPDF = useCallback(() => {
    setPdfLoading(true);
    try {
      const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      exportToPDF({
        transactions: filteredTransactions,
        periodLabel,
        tab: activeTab,
        stats: { totalIncome, totalExpense, balance: totalIncome - totalExpense },
        categoryBreakdown: activeTab === 'monthly'
          ? monthlyCategoryData.map((c) => ({
              category_id: c.category_id,
              category_name: c.name,
              category_icon: c.icon,
              category_color: c.color,
              total: c.total,
              percentage: c.percentage,
            }))
          : undefined,
      });
    } finally {
      setPdfLoading(false);
    }
  }, [filteredTransactions, periodLabel, activeTab, monthlyCategoryData]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Analise seus padrões financeiros</p>
        </div>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Analise seus padrões financeiros</p>
        </div>

        {/* Category Filter */}
        <Select value={selectedCategoryId} onValueChange={(v) => setSelectedCategoryId(v ?? 'all')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">📋 Todas as categorias</SelectItem>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="default"
          size="sm"
          onClick={exportPDF}
          disabled={pdfLoading || filteredTransactions.length === 0}
        >
          {pdfLoading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-1 h-4 w-4" />
          )}
          Exportar PDF
        </Button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportTab)}>
        <TabsList>
          <TabsTrigger value="weekly">
            <Calendar className="mr-1 h-4 w-4" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <BarChart3 className="mr-1 h-4 w-4" />
            Mensal
          </TabsTrigger>
          <TabsTrigger value="annual">
            <TrendingUp className="mr-1 h-4 w-4" />
            Anual
          </TabsTrigger>
        </TabsList>

        {/* ── Period Navigation ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
              ←
            </Button>
            <span className="min-w-[180px] text-center text-sm font-medium capitalize">
              {periodLabel}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('next')}>
              →
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setReferenceDate(new Date())}>
            Hoje
          </Button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* WEEKLY TAB                                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="weekly" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Gasto"
              value={formatCurrency(weeklySummary.totalSpent)}
              icon={TrendingDown}
              color={COLORS.expense}
            />
            <SummaryCard
              title="Total Recebido"
              value={formatCurrency(weeklySummary.totalIncome)}
              icon={TrendingUp}
              color={COLORS.income}
            />
            <SummaryCard
              title="Saldo da Semana"
              value={formatCurrency(weeklySummary.balance)}
              icon={DollarSign}
              color={COLORS.balance}
            />
            <SummaryCard
              title="Média / Dia"
              value={formatCurrency(weeklySummary.avgPerDay)}
              icon={BarChart3}
              color={COLORS.secondary}
            />
          </div>

          {/* Bar Chart: spending by day */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gastos por Dia da Semana</CardTitle>
              <Button variant="outline" size="sm" onClick={exportWeeklyCSV}>
                <Download className="mr-1 h-4 w-4" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {weeklyData.every((d) => d.income === 0 && d.expense === 0) ? (
                <EmptyState message="Nenhum dado para este período" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="dayShort" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Receitas" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Despesas" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Daily Totals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Diário</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData.every((d) => d.income === 0 && d.expense === 0) ? (
                <EmptyState message="Nenhum dado para este período" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Dia</th>
                        <th className="pb-2 font-medium text-right">Receitas</th>
                        <th className="pb-2 font-medium text-right">Despesas</th>
                        <th className="pb-2 font-medium text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.map((d, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 font-medium">{d.name}</td>
                          <td className="py-2 text-right text-emerald-600">
                            {d.income > 0 ? formatCurrency(d.income) : '—'}
                          </td>
                          <td className="py-2 text-right text-red-600">
                            {d.expense > 0 ? formatCurrency(d.expense) : '—'}
                          </td>
                          <td
                            className={`py-2 text-right font-medium ${
                              d.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(d.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* MONTHLY TAB                                                        */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Receitas"
              value={formatCurrency(monthlySummary.totalIncome)}
              icon={TrendingUp}
              color={COLORS.income}
            />
            <SummaryCard
              title="Total Despesas"
              value={formatCurrency(monthlySummary.totalExpense)}
              icon={TrendingDown}
              color={COLORS.expense}
            />
            <SummaryCard
              title="Saldo"
              value={formatCurrency(monthlySummary.balance)}
              icon={DollarSign}
              color={COLORS.balance}
            />
            <SummaryCard
              title="Taxa de Poupança"
              value={`${monthlySummary.savingsRate.toFixed(1)}%`}
              icon={PieChartIcon}
              color={COLORS.secondary}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bar Chart: spending by category */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gastos por Categoria</CardTitle>
                <Button variant="outline" size="sm" onClick={exportMonthlyCSV}>
                  <Download className="mr-1 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                {monthlyCategoryData.length === 0 ? (
                  <EmptyState message="Nenhum gasto registrado este mês" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyCategoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                        {monthlyCategoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart: income vs expense */}
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlySummary.totalIncome === 0 && monthlySummary.totalExpense === 0 ? (
                  <EmptyState message="Nenhum dado para este período" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData
                          .filter((d) => d.value > 0)
                          .map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyCategoryData.length === 0 ? (
                <EmptyState message="Nenhum gasto registrado este mês" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Categoria</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                        <th className="pb-2 font-medium text-right">Percentual</th>
                        <th className="pb-2 font-medium w-32">Barra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyCategoryData.map((c) => (
                        <tr key={c.category_id} className="border-b last:border-0">
                          <td className="py-2 font-medium">
                            <span className="mr-1">{c.icon}</span>
                            {c.name}
                          </td>
                          <td className="py-2 text-right">{formatCurrency(c.total)}</td>
                          <td className="py-2 text-right text-muted-foreground">
                            {c.percentage.toFixed(1)}%
                          </td>
                          <td className="py-2 pl-2">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${c.percentage}%`,
                                  backgroundColor: c.color,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ANNUAL TAB                                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="annual" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Receitas"
              value={formatCurrency(annualSummary.totalIncome)}
              icon={TrendingUp}
              color={COLORS.income}
            />
            <SummaryCard
              title="Total Despesas"
              value={formatCurrency(annualSummary.totalExpense)}
              icon={TrendingDown}
              color={COLORS.expense}
            />
            <SummaryCard
              title="Melhor Mês"
              value={
                annualSummary.bestMonth
                  ? `${annualSummary.bestMonth.month} (${formatCurrency(annualSummary.bestMonth.balance)})`
                  : '—'
              }
              icon={TrendingUp}
              color={COLORS.income}
            />
            <SummaryCard
              title="Pior Mês"
              value={
                annualSummary.worstMonth
                  ? `${annualSummary.worstMonth.month} (${formatCurrency(annualSummary.worstMonth.balance)})`
                  : '—'
              }
              icon={TrendingDown}
              color={COLORS.expense}
            />
          </div>

          {/* Line Chart: monthly balance over the year */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Saldo Mensal ao Longo do Ano</CardTitle>
              <Button variant="outline" size="sm" onClick={exportAnnualCSV}>
                <Download className="mr-1 h-4 w-4" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {annualData.every((m) => m.income === 0 && m.expense === 0) ? (
                <EmptyState message="Nenhum dado para este ano" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name="Saldo"
                      stroke={COLORS.balance}
                      strokeWidth={2}
                      dot={{ fill: COLORS.balance, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart: income vs expense per month (grouped) */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas vs Despesas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {annualData.every((m) => m.income === 0 && m.expense === 0) ? (
                <EmptyState message="Nenhum dado para este ano" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Receitas" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Despesas" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Mensal {year}</CardTitle>
            </CardHeader>
            <CardContent>
              {annualData.every((m) => m.income === 0 && m.expense === 0) ? (
                <EmptyState message="Nenhum dado para este ano" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Mês</th>
                        <th className="pb-2 font-medium text-right">Receitas</th>
                        <th className="pb-2 font-medium text-right">Despesas</th>
                        <th className="pb-2 font-medium text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annualData.map((m) => (
                        <tr key={m.monthIndex} className="border-b last:border-0">
                          <td className="py-2 font-medium">{m.month}</td>
                          <td className="py-2 text-right text-emerald-600">
                            {m.income > 0 ? formatCurrency(m.income) : '—'}
                          </td>
                          <td className="py-2 text-right text-red-600">
                            {m.expense > 0 ? formatCurrency(m.expense) : '—'}
                          </td>
                          <td
                            className={`py-2 text-right font-medium ${
                              m.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(m.balance)}
                          </td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr className="border-t-2 font-bold">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-right text-emerald-600">
                          {formatCurrency(annualSummary.totalIncome)}
                        </td>
                        <td className="py-2 text-right text-red-600">
                          {formatCurrency(annualSummary.totalExpense)}
                        </td>
                        <td
                          className={`py-2 text-right ${
                            annualSummary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(annualSummary.balance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
