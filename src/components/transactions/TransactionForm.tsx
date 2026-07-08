import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useWallets } from '@/hooks/useWallets';
import { RECURRING_TYPES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { Category, Transaction } from '@/types';

export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string;
  date: string;
  is_recurring: boolean;
  recurring_type: 'monthly' | 'weekly' | 'yearly' | null;
  wallet_id?: string | null;
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  initialData?: Partial<Transaction>;
  isLoading?: boolean;
}

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function TransactionForm({
  onSubmit,
  initialData,
  isLoading = false,
}: TransactionFormProps) {
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const { wallets, loading: walletsLoading, fetchWallets } = useWallets();

  const [type, setType] = useState<'income' | 'expense'>(initialData?.type ?? 'expense');
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() ?? '');
  const [description, setDescription] = useState<string>(initialData?.description ?? '');
  const [categoryId, setCategoryId] = useState<string>(initialData?.category_id ?? '');
  const [date, setDate] = useState<string>(initialData?.date?.split('T')[0] ?? getTodayDate());
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringType, setRecurringType] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [walletId, setWalletId] = useState<string | null>(initialData?.wallet_id ?? null);

  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    category_id?: string;
  }>({});

  useEffect(() => {
    fetchCategories();
    fetchWallets();
  }, [fetchCategories, fetchWallets]);

  // Filter categories based on selected type
  const filteredCategories = categories.filter((cat) => cat.type === type);

  // Reset category when type changes
  useEffect(() => {
    setCategoryId('');
  }, [type]);

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    const amountNum = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!categoryId) {
      newErrors.category_id = 'Categoria é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, description, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const amountNum = parseFloat(amount.replace(',', '.'));

    onSubmit({
      type,
      amount: amountNum,
      description: description.trim(),
      category_id: categoryId,
      date,
      is_recurring: isRecurring,
      recurring_type: isRecurring ? recurringType : null,
      wallet_id: walletId,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and comma/dot
    if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: undefined }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Toggle */}
      <div className="space-y-2">
        <Label>Tipo</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-base font-semibold transition-all ${
              type === 'expense'
                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600'
            }`}
          >
            Saída 💸
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-base font-semibold transition-all ${
              type === 'income'
                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600'
            }`}
          >
            Entrada 💰
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            R$
          </span>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={handleAmountChange}
            className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.amount && (
          <p className="text-sm text-red-500">{errors.amount}</p>
        )}
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          type="text"
          placeholder="Ex: Supermercado, Aluguel, Salário..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: undefined }));
            }
          }}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Category Select */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value ?? '');
            if (errors.category_id) {
              setErrors((prev) => ({ ...prev, category_id: undefined }));
            }
          }}
        >
          <SelectTrigger
            className={`w-full ${errors.category_id ? 'border-red-500' : ''}`}
          >
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categoriesLoading ? (
              <SelectItem value="loading" disabled>
                Carregando categorias...
              </SelectItem>
            ) : filteredCategories.length === 0 ? (
              <SelectItem value="empty" disabled>
                Nenhuma categoria encontrada
              </SelectItem>
            ) : (
              filteredCategories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id}>
                  <span className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-sm text-red-500">{errors.category_id}</p>
        )}
      </div>

      {/* Wallet Select */}
      <div className="space-y-2">
        <Label>Cartão / Conta (opcional)</Label>
        <Select
          value={walletId || '__none__'}
          onValueChange={(value) => setWalletId(value === '__none__' ? null : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um cartão ou conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Nenhum</SelectItem>
            {walletsLoading ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : wallets.filter((w) => w.is_active).length === 0 ? (
              <SelectItem value="empty" disabled>
                Cadastre cartões/contas em Cartões e Bancos
              </SelectItem>
            ) : (
              wallets
                .filter((w) => w.is_active)
                .map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <span className="flex items-center gap-2">
                      <span>{wallet.icon}</span>
                      <span>{wallet.name}</span>
                      <span className="text-muted-foreground">
                        ({formatCurrency(wallet.balance)})
                      </span>
                    </span>
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
        {wallets.filter((w) => w.is_active).length === 0 && !walletsLoading && (
          <p className="text-xs text-muted-foreground">
            Cadastre cartões/contas em{' '}
            <a href="/wallets" className="text-indigo-500 hover:underline">
              Cartões e Bancos
            </a>
          </p>
        )}
      </div>

      {/* Date Input */}
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Recurring Toggle */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label htmlFor="is_recurring" className="cursor-pointer">
            Transação recorrente
          </Label>
        </div>

        {isRecurring && (
          <div className="space-y-2">
            <Label>Frequência</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(RECURRING_TYPES).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRecurringType(key as 'monthly' | 'weekly' | 'yearly')}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                    recurringType === key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Salvando...
          </span>
        ) : (
          'Salvar'
        )}
      </Button>
    </form>
  );
}
