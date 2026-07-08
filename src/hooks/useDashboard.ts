import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './useTransactions';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  parseISO,
  isWithinInterval,
  getDay,
} from 'date-fns';
import type {
  Transaction,
  TransactionStats,
  MonthlyStats,
  WeeklyDayStats,
  CategoryBreakdown,
  DashboardData,
} from '@/types';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function computeMonthlyStats(transactions: Transaction[]): TransactionStats {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let total_income = 0;
  let total_expense = 0;

  for (const t of transactions) {
    const tDate = parseISO(t.date);
    if (isWithinInterval(tDate, { start: monthStart, end: monthEnd })) {
      if (t.type === 'income') {
        total_income += t.amount;
      } else {
        total_expense += t.amount;
      }
    }
  }

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
  };
}

function computeWeeklyStats(transactions: Transaction[]): WeeklyDayStats[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map((day) => {
    const dayStr = DAY_NAMES[getDay(day)];
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const tDate = parseISO(t.date);
      if (
        tDate.getFullYear() === day.getFullYear() &&
        tDate.getMonth() === day.getMonth() &&
        tDate.getDate() === day.getDate()
      ) {
        if (t.type === 'income') {
          income += t.amount;
        } else {
          expense += t.amount;
        }
      }
    }

    return { day: dayStr, income, expense };
  });
}

function computeAnnualStats(transactions: Transaction[]): MonthlyStats[] {
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return months.map((month) => {
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const monthLabel = MONTH_NAMES[month.getMonth()];
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const tDate = parseISO(t.date);
      if (isWithinInterval(tDate, { start: mStart, end: mEnd })) {
        if (t.type === 'income') {
          income += t.amount;
        } else {
          expense += t.amount;
        }
      }
    }

    return {
      month: monthLabel,
      income,
      expense,
      balance: income - expense,
    };
  });
}

function computeCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const categoryMap = new Map<
    string,
    { name: string; icon: string; color: string; total: number }
  >();

  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.type !== 'expense') continue;

    const tDate = parseISO(t.date);
    if (!isWithinInterval(tDate, { start: monthStart, end: monthEnd })) continue;

    totalExpenses += t.amount;

    const existing = categoryMap.get(t.category_id);
    if (existing) {
      existing.total += t.amount;
    } else {
      categoryMap.set(t.category_id, {
        name: t.category?.name ?? 'Sem categoria',
        icon: t.category?.icon ?? '📋',
        color: t.category?.color ?? '#6B7280',
        total: t.amount,
      });
    }
  }

  const breakdown: CategoryBreakdown[] = [];

  for (const [categoryId, data] of categoryMap.entries()) {
    breakdown.push({
      category_id: categoryId,
      category_name: data.name,
      category_icon: data.icon,
      category_color: data.color,
      total: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    });
  }

  return breakdown.sort((a, b) => b.total - a.total);
}

function computeFixedVsVariable(transactions: Transaction[]) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let fixed = 0;
  let variable = 0;

  for (const t of transactions) {
    if (t.type !== 'expense') continue;

    const tDate = parseISO(t.date);
    if (!isWithinInterval(tDate, { start: monthStart, end: monthEnd })) continue;

    if (t.recurrence !== 'none') {
      fixed += t.amount;
    } else {
      variable += t.amount;
    }
  }

  const total = fixed + variable;

  return {
    fixed,
    variable,
    fixedPercentage: total > 0 ? (fixed / total) * 100 : 0,
    variablePercentage: total > 0 ? (variable / total) * 100 : 0,
  };
}

export function useDashboard() {
  const { transactions, loading: transactionsLoading, fetchTransactions } = useTransactions();
  const [loading, setLoading] = useState(true);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Update loading state based on transactions fetch
  useEffect(() => {
    if (!transactionsLoading && transactions.length >= 0) {
      setLoading(false);
    }
  }, [transactionsLoading, transactions]);

  const dashboardData = useMemo((): DashboardData => {
    const monthlyStats = computeMonthlyStats(transactions);
    const weeklyStats = computeWeeklyStats(transactions);
    const annualStats = computeAnnualStats(transactions);
    const categoryBreakdown = computeCategoryBreakdown(transactions);
    const fixedVsVariable = computeFixedVsVariable(transactions);

    // Recent transactions: last 10 by date
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      monthlyStats,
      weeklyStats,
      annualStats,
      categoryBreakdown,
      recentTransactions,
      fixedVsVariable,
    };
  }, [transactions]);

  return {
    ...dashboardData,
    loading,
    refresh: fetchTransactions,
  };
}
