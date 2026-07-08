import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionFilters, TransactionStats } from '@/types';

interface UseTransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  stats: TransactionStats;
}

function computeStats(transactions: Transaction[]): TransactionStats {
  let total_income = 0;
  let total_expense = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      total_income += t.amount;
    } else {
      total_expense += t.amount;
    }
  }

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
  };
}

export function useTransactions() {
  const [state, setState] = useState<UseTransactionsState>({
    transactions: [],
    loading: false,
    error: null,
    stats: { total_income: 0, total_expense: 0, balance: 0 },
  });

  const fetchTransactions = useCallback(async (filters?: TransactionFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (filters) {
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id);
        }
        if (filters.dateFrom) {
          query = query.gte('date', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('date', filters.dateTo);
        }
        if (filters.period) {
          const now = new Date();
          let startDate: Date;

          switch (filters.period) {
            case 'week': {
              const dayOfWeek = now.getDay();
              startDate = new Date(now);
              startDate.setDate(now.getDate() - dayOfWeek);
              startDate.setHours(0, 0, 0, 0);
              break;
            }
            case 'month': {
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            }
            case 'year': {
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
            }
          }

          // Only apply period filter if dateFrom/dateTo weren't explicitly provided
          if (!filters.dateFrom && !filters.dateTo) {
            query = query.gte('date', startDate!.toISOString().split('T')[0]);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const transactions = (data ?? []) as Transaction[];
      const stats = computeStats(transactions);

      setState({ transactions, loading: false, error: null, stats });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  const createTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: newTransaction, error } = await supabase
          .from('transactions')
          .insert({ ...data, user_id: user.id })
          .select('*, category:categories(*)')
          .single();

        if (error) throw error;

        setState((prev) => {
          const transactions = [newTransaction as Transaction, ...prev.transactions];
          return { transactions, loading: false, error: null, stats: computeStats(transactions) };
        });

        return newTransaction as Transaction;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create transaction';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'category'>>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data: updated, error } = await supabase
          .from('transactions')
          .update(data)
          .eq('id', id)
          .select('*, category:categories(*)')
          .single();

        if (error) throw error;

        setState((prev) => {
          const transactions = prev.transactions.map((t) =>
            t.id === id ? (updated as Transaction) : t
          );
          return { transactions, loading: false, error: null, stats: computeStats(transactions) };
        });

        return updated as Transaction;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update transaction';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setState((prev) => {
          const transactions = prev.transactions.filter((t) => t.id !== id);
          return { transactions, loading: false, error: null, stats: computeStats(transactions) };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete transaction';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  return {
    transactions: state.transactions,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
