import { toNumber } from "@/lib/utils";
import type {
  Budget,
  Category,
  CurrencySummary,
  TransactionWithCategory,
  UserSettings,
} from "@/types/finance";
import type { Database } from "@/types/database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];
type SearchTransactionRow = Database["public"]["Functions"]["search_transactions"]["Returns"][number];
type DashboardRow = Database["public"]["Functions"]["get_dashboard_summary"]["Returns"][number];

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    userId: row.user_id,
    currency: row.currency,
    month: row.month,
    amount: toNumber(row.amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSettings(row: SettingsRow): UserSettings {
  return {
    userId: row.user_id,
    language: row.language,
    theme: row.theme,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTransaction(row: SearchTransactionRow): TransactionWithCategory {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    type: row.type,
    currency: row.currency,
    amount: toNumber(row.amount),
    occurredAt: row.occurred_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryNameEn: row.category_name_en,
    categoryNameAr: row.category_name_ar,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
  };
}

export function mapDashboardSummary(row: DashboardRow): CurrencySummary {
  return {
    currency: row.currency,
    balance: toNumber(row.balance),
    todayExpenses: toNumber(row.today_expenses),
    weeklyExpenses: toNumber(row.weekly_expenses),
    monthlyExpenses: toNumber(row.monthly_expenses),
    budgetAmount: toNumber(row.budget_amount),
    remainingBudget: toNumber(row.remaining_budget),
    budgetPercentage: toNumber(row.budget_percentage),
  };
}
