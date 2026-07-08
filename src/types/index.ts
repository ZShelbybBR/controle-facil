export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
  recurrence?: 'none' | 'monthly' | 'weekly' | 'yearly';
  category?: Category;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  created_at: string;
}

export type TransactionType = 'income' | 'expense';

export interface TransactionFilters {
  type?: TransactionType;
  category_id?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: 'week' | 'month' | 'year';
}

export interface TransactionStats {
  total_income: number;
  total_expense: number;
  balance: number;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'cash' | 'credit';
  created_at: string;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface WeeklyDayStats {
  day: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  percentage: number;
}

export interface DashboardData {
  monthlyStats: TransactionStats;
  weeklyStats: WeeklyDayStats[];
  annualStats: MonthlyStats[];
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: Transaction[];
  fixedVsVariable: {
    fixed: number;
    variable: number;
    fixedPercentage: number;
    variablePercentage: number;
  };
}
