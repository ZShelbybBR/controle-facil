import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Wallet } from '@/types';

interface UseWalletsState {
  wallets: Wallet[];
  loading: boolean;
  error: string | null;
}

export function useWallets() {
  const [state, setState] = useState<UseWalletsState>({
    wallets: [],
    loading: false,
    error: null,
  });

  const fetchWallets = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setState({ wallets: (data ?? []) as Wallet[], loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallets';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  const createWallet = useCallback(
    async (data: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: newWallet, error } = await supabase
          .from('wallets')
          .insert({ ...data, user_id: user.id })
          .select('*')
          .single();

        if (error) throw error;
        setState((prev) => ({
          wallets: [...prev.wallets, newWallet as Wallet],
          loading: false,
          error: null,
        }));
        return newWallet as Wallet;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create wallet';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const updateWallet = useCallback(
    async (id: string, data: Partial<Omit<Wallet, 'id' | 'created_at' | 'updated_at'>>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data: updated, error } = await supabase
          .from('wallets')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;
        setState((prev) => ({
          wallets: prev.wallets.map((w) => (w.id === id ? (updated as Wallet) : w)),
          loading: false,
          error: null,
        }));
        return updated as Wallet;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update wallet';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const deleteWallet = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
      setState((prev) => ({
        wallets: prev.wallets.filter((w) => w.id !== id),
        loading: false,
        error: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete wallet';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  return {
    wallets: state.wallets,
    loading: state.loading,
    error: state.error,
    fetchWallets,
    createWallet,
    updateWallet,
    deleteWallet,
  };
}
