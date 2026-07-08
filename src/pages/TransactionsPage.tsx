import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Transaction } from '@/types';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import type { TransactionFormData } from '@/components/transactions/TransactionForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, ArrowDownLeft, ArrowUpRight, Wallet, TrendingDown, TrendingUp } from 'lucide-react';

/* ─── helpers ─── */

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthToRange(month: string): { dateFrom: string; dateTo: string } {
  const [year, m] = month.split('-').map(Number);
  const dateFrom = `${year}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const dateTo = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { dateFrom, dateTo };
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/* ─── main component ─── */

export function TransactionsPage() {
  const {
    transactions,
    loading,
    error,
    stats,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const { categories, fetchCategories } = useCategories();

  // filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonth());

  // dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);

  /* fetch categories on mount */
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* build filters and fetch transactions */
  const applyFilters = useCallback(() => {
    const { dateFrom, dateTo } = monthToRange(filterMonth);
    const filters: Record<string, string> = { dateFrom, dateTo };

    if (filterType !== 'all') {
      filters.type = filterType;
    }
    if (filterCategoryId) {
      filters.category_id = filterCategoryId;
    }

    fetchTransactions(filters as any);
  }, [filterType, filterCategoryId, filterMonth, fetchTransactions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  /* helpers for month navigation */
  function changeMonth(delta: number) {
    const [year, m] = filterMonth.split('-').map(Number);
    const d = new Date(year, m - 1 + delta, 1);
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  /* dialog handlers */
  function openCreate() {
    setEditingTransaction(null);
    setDialogOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingTransaction(tx);
    setDialogOpen(true);
  }

  async function handleFormSubmit(data: TransactionFormData) {
    setSaving(true);
    try {
      const payload = {
        category_id: data.category_id,
        description: data.description,
        amount: data.amount,
        type: data.type as 'income' | 'expense',
        date: data.date,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
      } else {
        await createTransaction({ ...payload, user_id: '' });
      }
      setDialogOpen(false);
      setEditingTransaction(null);
      applyFilters();
    } catch {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      applyFilters();
    } catch {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  }

  function getCategoryForTransaction(tx: Transaction) {
    if (tx.category) return tx.category;
    return categories.find((c) => c.id === tx.category_id) ?? null;
  }

  /* ─── render ─── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Type toggle */}
        <div className="flex rounded-lg border bg-muted p-0.5">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                filterType === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'all' ? 'Todas' : t === 'income' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex-1">
          <Select value={filterCategoryId || '__all__'} onValueChange={(v) => setFilterCategoryId(v === '__all__' ? '' : (v ?? ''))}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
            ‹
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {formatMonthLabel(filterMonth)}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
            ›
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entradas</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(stats.total_income)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saídas</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(stats.total_expense)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
              <Wallet className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={cn('text-lg font-bold', stats.balance >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(stats.balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {loading && transactions.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && transactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma transação encontrada</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Adicione sua primeira transação clicando no botão &quot;+ Nova Transação&quot; acima.
            </p>
            <Button onClick={openCreate} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction list */}
      {transactions.length > 0 && (
        <Card>
          <CardContent className="divide-y p-0">
            {transactions.map((tx) => {
              const cat = getCategoryForTransaction(tx);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  {/* Category icon */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{
                      backgroundColor: (cat?.color ?? '#6b7280') + '22',
                      border: `2px solid ${(cat?.color ?? '#6b7280')}44`,
                    }}
                  >
                    {cat?.icon ?? '📌'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{tx.description}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {cat?.name ?? 'Sem categoria'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        isIncome ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                    {isIncome ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(tx)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(tx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
          </DialogHeader>

          <TransactionForm
            onSubmit={handleFormSubmit}
            initialData={editingTransaction ?? undefined}
            isLoading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Transação</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir a transação{' '}
            <strong>&quot;{deleteTarget?.description}&quot;</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
