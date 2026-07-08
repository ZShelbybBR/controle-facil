import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export function useCategories() {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: false,
    error: null,
  });

  const fetchCategories = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setState({ categories: (data ?? []) as Category[], loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  const createCategory = useCallback(
    async (data: Omit<Category, 'id' | 'created_at'>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert({ ...data, user_id: user.id })
          .select('*')
          .single();

        if (error) throw error;

        setState((prev) => ({
          categories: [...prev.categories, newCategory as Category],
          loading: false,
          error: null,
        }));

        return newCategory as Category;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create category';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<Omit<Category, 'id' | 'created_at'>>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data: updated, error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;

        setState((prev) => ({
          categories: prev.categories.map((c) =>
            c.id === id ? (updated as Category) : c
          ),
          loading: false,
          error: null,
        }));

        return updated as Category;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update category';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setState((prev) => ({
          categories: prev.categories.filter((c) => c.id !== id),
          loading: false,
          error: null,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete category';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  return {
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
