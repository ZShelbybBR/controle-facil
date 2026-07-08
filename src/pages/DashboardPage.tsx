import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowRight,
  Wallet,
  CalendarDays,
  ShoppingCart,
  CreditCard,
  Home,
  Zap,
  Coffee,
  Gift,
  Car,
  Heart,
  Film,
  BookOpen,
  Plus,
  Minus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FixedExpensesCard } from '@/components/dashboard/FixedExpensesCard';
import { MonthlyGoalCard } from '@/components/dashboard/MonthlyGoalCard';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import type { TransactionFormData } from '@/components/transactions/TransactionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PIE_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#8b5555',
  '#ef4444',
  '#eab308',
  '#f97316',
  '#06b6d4',
  '#10b981',
  '#6366f1',
  '#6b7280',
];

const ICON_MAP: Record<string, React.ReactNode> = {
  'shopping-cart': <ShoppingCart className="h-4 w-4" />,
  'credit-card': <CreditCard className="h-4 w-4" />,
  home: <Home className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  coffee: <Coffee className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  film: <Film className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
  dollar: <DollarSign className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || <Wallet className="h-4 w-4" />;
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

function SkeletonChart() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-64 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

function SkeletonTransactionList() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const {
    monthlyStats,
    annualStats,
    categoryBreakdown,
    recentTransactions,
    fixedVsVariable,
    loading,
  } = useDashboard();

  const { createTransaction } = useTransactions();

  // Quick-add dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'income' | 'expense'>('expense');
  const [saving, setSaving] = useState(false);

  function openQuickAdd(type: 'income' | 'expense') {
    setDialogType(type);
    setDialogOpen(true);
  }

  async function handleQuickAdd(data: TransactionFormData) {
    setSaving(true);
    try {
      await createTransaction({ ...data, type: dialogType, user_id: '' });
      setDialogOpen(false);
    } catch {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  }

  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Prepare bar chart data (last 6 months)
  const last6Months = annualStats.slice(-6).map((s) => ({
    name: s.month,
    Receitas: s.income,
    Despesas: s.expense,
  }));

  // Prepare pie chart data
  const pieData = categoryBreakdown.map((c) => ({
    name: c.category_name,
    value: c.total,
    color: c.category_color,
  }));

  // Get actual transaction count from monthly data
  const transactionCount = recentTransactions.length;

  // Fixed vs Variable percentages
  const fixedPct = Math.round(fixedVsVariable.fixedPercentage);
  const variablePct = Math.round(fixedVsVariable.variablePercentage);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Loading skeletons */}
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-muted animate-pulse-glow" />
          <div className="h-4 w-96 rounded-xl bg-muted animate-pulse-glow" style={{ animationDelay: '0.1s' }} />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>

        <SkeletonTransactionList />
      </div>
    );
  }

  // Empty state
  const isEmpty = recentTransactions.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {userName}! 👋
        </h1>
        <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
          <CalendarDays className="h-4 w-4" />
          {today}
        </p>
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-3 animate-slide-up" style={{ animationDelay: '0.08s' }}>
        <Button
          onClick={() => openQuickAdd('income')}
          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white gap-2 h-11 px-6"
        >
          <Plus className="h-4 w-4" />
          Nova Receita
        </Button>
        <Button
          onClick={() => openQuickAdd('expense')}
          className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white gap-2 h-11 px-6"
        >
          <Minus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-5xl">📊</div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Nenhuma transação encontrada</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Comece cadastrando sua primeira transação para ver seus dados financeiros aqui!
                </p>
              </div>
              <Link
                to="/transactions"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                Adicionar transação <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!isEmpty && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Saldo Total */}
            <Card className="group hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                    <p className="text-2xl font-bold text-indigo-600 number-transition">
                      {formatCurrency(monthlyStats.balance)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receitas do Mês */}
            <Card className="group hover:shadow-lg hover:shadow-green-500/5 hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Receitas do Mês</p>
                    <p className="text-2xl font-bold text-green-600 number-transition">
                      {formatCurrency(monthlyStats.total_income)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">↑ Receitas</span>
                </div>
              </CardContent>
            </Card>

            {/* Despesas do Mês */}
            <Card className="group hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Despesas do Mês</p>
                    <p className="text-2xl font-bold text-red-600 number-transition">
                      {formatCurrency(monthlyStats.total_expense)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform duration-300">
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600">↓ Despesas</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Transações */}
            <Card className="group hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Transações</p>
                    <p className="text-2xl font-bold text-blue-600 number-transition">
                      {transactionCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed vs Variable */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Despesas Fixas vs Variáveis</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{fixedPct}%</span> fixos
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{variablePct}%</span> variáveis
                  </span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="bg-indigo-500 transition-all duration-500"
                    style={{ width: `${fixedPct}%` }}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: `${variablePct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs text-muted-foreground">Fixos ({formatCurrency(fixedVsVariable.fixed)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Variáveis ({formatCurrency(fixedVsVariable.variable)})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fixed Expenses & Monthly Goal */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <FixedExpensesCard />
            <MonthlyGoalCard />
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Bar Chart - Receitas vs Despesas */}
            <Card className="animate-slide-up shadow-sm hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.35s' }}>
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                {last6Months.every((m) => m.Receitas === 0 && m.Despesas === 0) ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Sem dados para exibir
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={last6Months} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--background))',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - Gastos por Categoria */}
            <Card className="animate-slide-up shadow-sm hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Sem dados para exibir
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--background))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="animate-slide-up shadow-sm hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.45s' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transações Recentes</CardTitle>
              <Link
                to="/transactions"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Ver todas as transações <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Category icon */}
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: transaction.category?.color
                          ? `${transaction.category.color}20`
                          : 'hsl(var(--muted))',
                        color: transaction.category?.color || 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {getIcon(transaction.category?.icon || 'wallet')}
                    </div>

                    {/* Description & category */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {transaction.category?.name || 'Sem categoria'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <p
                      className={`font-semibold shrink-0 ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick-add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'income' ? '💰 Nova Receita' : '💸 Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleQuickAdd}
            initialData={{ type: dialogType }}
            isLoading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
