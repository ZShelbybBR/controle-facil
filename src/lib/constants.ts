export const DEFAULT_CATEGORIES = [
  { name: "Alimentação", icon: "🍔", color: "#22c55e" },
  { name: "Transporte", icon: "🚗", color: "#3b82f6" },
  { name: "Moradia", icon: "🏠", color: "#8b5cf6" },
  { name: "Saúde", icon: "💊", color: "#ef4444" },
  { name: "Educação", icon: "📚", color: "#eab308" },
  { name: "Lazer", icon: "🎮", color: "#f97316" },
  { name: "Investimentos", icon: "📈", color: "#06b6d4" },
  { name: "Salário", icon: "💰", color: "#10b981" },
  { name: "Freelance", icon: "💻", color: "#6366f1" },
  { name: "Outros", icon: "📌", color: "#6b7280" },
] as const;

export const RECURRING_TYPES: Record<string, string> = {
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
};

export const TRANSACTION_TYPES: Record<string, string> = {
  income: "Entrada",
  expense: "Saída",
};

export const WALLET_TYPES = [
  { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳', color: '#ef4444' },
  { value: 'debit_card', label: 'Cartão de Débito', icon: '💳', color: '#f97316' },
  { value: 'checking', label: 'Conta Corrente', icon: '🏦', color: '#3b82f6' },
  { value: 'savings', label: 'Poupança', icon: '🐷', color: '#22c55e' },
  { value: 'investment', label: 'Investimento', icon: '📈', color: '#8b5cf6' },
  { value: 'cash', label: 'Dinheiro', icon: '💵', color: '#eab308' },
  { value: 'other', label: 'Outro', icon: '💰', color: '#6b7280' },
] as const;

export const WALLET_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#3b82f6',
  '#f97316', '#8b5cf6', '#06b6d4', '#10b981',
  '#eab308', '#6b7280', '#ec4899', '#14b8a6',
];
