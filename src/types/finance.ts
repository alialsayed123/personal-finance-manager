export const CURRENCIES = ["USD", "SYP"] as const;
export const TRANSACTION_TYPES = ["income", "expense"] as const;
export const CATEGORY_TYPES = ["income", "expense"] as const;
export const APP_LANGUAGES = ["en", "ar"] as const;
export const APP_THEMES = ["light", "dark", "system"] as const;

export type Currency = (typeof CURRENCIES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export type AppTheme = (typeof APP_THEMES)[number];

export interface Category {
  id: string;
  userId: string;
  type: CategoryType;
  nameEn: string;
  nameAr: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  currency: Currency;
  amount: number;
  occurredAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionWithCategory extends Transaction {
  categoryNameEn: string;
  categoryNameAr: string;
  categoryIcon: string;
  categoryColor: string;
}

export interface Budget {
  id: string;
  userId: string;
  currency: Currency;
  month: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  language: AppLanguage;
  theme: AppTheme;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencySummary {
  currency: Currency;
  balance: number;
  todayExpenses: number;
  weeklyExpenses: number;
  monthlyExpenses: number;
  budgetAmount: number;
  remainingBudget: number;
  budgetPercentage: number;
}

export interface CategoryDistributionItem {
  categoryId: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}

export interface MonthlyExpenseItem {
  month: string;
  total: number;
}

export interface BalanceHistoryItem {
  date: string;
  balance: number;
}

export interface StatisticsData {
  currency: Currency;
  from: string;
  to: string;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  categoryDistribution: CategoryDistributionItem[];
  monthlyExpenses: MonthlyExpenseItem[];
  balanceHistory: BalanceHistoryItem[];
}

export interface TransactionCurrencyTotal {
  currency: Currency;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  transactionCount: number;
}

export interface PaginatedTransactions {
  items: TransactionWithCategory[];
  totals: TransactionCurrencyTotal[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface TransactionFilters {
  query?: string;
  currency?: Currency | "all";
  type?: TransactionType | "all";
  categoryId?: string | "all";
  from?: string;
  to?: string;
  sortBy?: "occurred_at" | "amount" | "created_at";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
