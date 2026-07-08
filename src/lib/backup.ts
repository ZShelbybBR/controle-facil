import { supabase } from '@/lib/supabase';
import type { Transaction, Category } from '@/types';

interface BackupData {
  version: string;
  exportedAt: string;
  transactions: Omit<Transaction, 'category'>[];
  categories: Category[];
}

/**
 * Fetch all transactions and categories, create a JSON backup, and trigger download.
 */
export async function exportBackup(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const [transactionsResult, categoriesResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true }),
  ]);

  if (transactionsResult.error) throw transactionsResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    transactions: (transactionsResult.data ?? []) as Omit<Transaction, 'category'>[],
    categories: (categoriesResult.data ?? []) as Category[],
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().slice(0, 10);
  link.download = `controle-facil-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Import a JSON backup file. Validates structure, then upserts to Supabase.
 * Returns a summary of what was imported.
 */
export async function importBackup(file: File): Promise<{
  categoriesImported: number;
  transactionsImported: number;
}> {
  const text = await file.text();
  let data: BackupData;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Arquivo JSON inválido');
  }

  if (!data.version || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
    throw new Error('Formato de backup inválido — arquivo não é um backup do ControleFácil');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Import categories first (transactions reference them)
  const categoryMap = new Map<string, string>(); // old_id -> new_id

  for (const cat of data.categories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', cat.name)
      .eq('type', cat.type)
      .maybeSingle();

    if (existing) {
      categoryMap.set(cat.id, existing.id);
    } else {
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          type: cat.type,
        })
        .select('id')
        .single();

      if (error) throw error;
      categoryMap.set(cat.id, newCat.id);
    }
  }

  // Import transactions
  let transactionsImported = 0;

  for (const tx of data.transactions) {
    const newCategoryId = categoryMap.get(tx.category_id) ?? tx.category_id;

    // Check for duplicate (same user, date, amount, description, category)
    const { data: duplicate } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', tx.date)
      .eq('amount', tx.amount)
      .eq('description', tx.description)
      .eq('category_id', newCategoryId)
      .maybeSingle();

    if (duplicate) continue;

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      category_id: newCategoryId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      date: tx.date,
      recurrence: tx.recurrence,
    });

    if (error) throw error;
    transactionsImported++;
  }

  return {
    categoriesImported: categoryMap.size,
    transactionsImported,
  };
}

/**
 * Export all transactions as a CSV download.
 */
export async function exportCSV(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(name, icon)')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;

  const transactions = (data ?? []) as Transaction[];
  if (transactions.length === 0) throw new Error('Nenhuma transação para exportar');

  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
  const rows = transactions.map((t) => {
    const tipo = t.type === 'income' ? 'Receita' : 'Despesa';
    const categoria = t.category ? `${t.category.icon} ${t.category.name}` : 'Sem categoria';
    return [
      t.date,
      tipo,
      categoria,
      t.description,
      t.amount.toFixed(2),
    ];
  });

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell);
        return str.includes(',') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().slice(0, 10);
  link.download = `controle-facil-transacoes-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
