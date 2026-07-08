import { useMemo } from 'react';
import {
  CreditCard,
  Home,
  Zap,
  Coffee,
  ShoppingCart,
  Car,
  Heart,
  Film,
  BookOpen,
  DollarSign,
  Wallet,
  Recycle,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseISO, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ICON_MAP: Record<string, React.ReactNode> = {
  'shopping-cart': <ShoppingCart className="h-4 w-4" />,
  'credit-card': <CreditCard className="h-4 w-4" />,
  home: <Home className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  coffee: <Coffee className="h-4 w-4" />,
  gift: <DollarSign className="h-4 w-4" />,
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

function getNextDueDate(dateStr: string, recurrence: string): string {
  const date = parseISO(dateStr);
  const now = new Date();

  let nextDate = new Date(date);

  // Find next occurrence after today
  while (nextDate <= now) {
    switch (recurrence) {
      case 'monthly':
        nextDate = addMonths(nextDate, 1);
        break;
      case 'weekly':
        nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        nextDate = addMonths(nextDate, 12);
        break;
      default:
        return format(date, "dd 'de' MMM", { locale: ptBR });
    }
  }

  return format(nextDate, "dd 'de' MMM", { locale: ptBR });
}

export function FixedExpensesCard() {
  const { recentTransactions, fixedVsVariable, monthlyStats } = useDashboard();

  const fixedExpenses = useMemo(() => {
    return recentTransactions
      .filter((t) => t.type === 'expense' && t.recurrence && t.recurrence !== 'none')
      .sort((a, b) => a.amount - b.amount);
  }, [recentTransactions]);

  // Color indicator based on fixed expenses vs income ratio
  const fixedRatio = monthlyStats.total_income > 0
    ? (fixedVsVariable.fixed / monthlyStats.total_income) * 100
    : 0;

  let statusColor = 'text-green-600';
  let statusBg = 'bg-green-100 dark:bg-green-900/30';
  let statusLabel = 'Saudável';

  if (fixedRatio >= 70) {
    statusColor = 'text-red-600';
    statusBg = 'bg-red-100 dark:bg-red-900/30';
    statusLabel = 'Atenção';
  } else if (fixedRatio >= 50) {
    statusColor = 'text-yellow-600';
    statusBg = 'bg-yellow-100 dark:bg-yellow-900/30';
    statusLabel = 'Moderado';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Recycle className="h-5 w-5 text-indigo-600" />
          Despesas Fixas
        </CardTitle>
        <Badge variant="secondary" className={`${statusColor} ${statusBg}`}>
          {statusLabel}
        </Badge>
      </CardHeader>
      <CardContent>
        {fixedExpenses.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhuma despesa fixa encontrada
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {fixedExpenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: expense.category?.color
                        ? `${expense.category.color}20`
                        : 'hsl(var(--muted))',
                      color: expense.category?.color || 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {getIcon(expense.category?.icon || 'wallet')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Próximo: {getNextDueDate(expense.date, expense.recurrence || 'monthly')}
                    </p>
                  </div>
                  <p className="font-semibold text-sm text-red-600 shrink-0">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Fixas</span>
              <span className="font-bold text-red-600">
                {formatCurrency(fixedVsVariable.fixed)}
              </span>
            </div>

            {/* Ratio indicator */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>% da renda mensal</span>
                <span className={`font-medium ${statusColor}`}>{fixedRatio.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    fixedRatio >= 70
                      ? 'bg-red-500'
                      : fixedRatio >= 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(fixedRatio, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
