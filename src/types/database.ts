import type {
  AppLanguage,
  AppTheme,
  CategoryType,
  Currency,
  TransactionType,
} from "@/types/finance";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          type: CategoryType;
          name_en: string;
          name_ar: string;
          icon: string;
          color: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: CategoryType;
          name_en: string;
          name_ar: string;
          icon?: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          type: TransactionType;
          currency: Currency;
          amount: number;
          occurred_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          type: TransactionType;
          currency: Currency;
          amount: number;
          occurred_at: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          currency: Currency;
          month: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency: Currency;
          month: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          language: AppLanguage;
          theme: AppTheme;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          language?: AppLanguage;
          theme?: AppTheme;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_user_defaults: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      get_dashboard_summary: {
        Args: { p_today: string };
        Returns: Array<{
          currency: Currency;
          balance: number;
          today_expenses: number;
          weekly_expenses: number;
          monthly_expenses: number;
          budget_amount: number;
          remaining_budget: number;
          budget_percentage: number;
        }>;
      };
      search_transactions: {
        Args: {
          p_query?: string | null;
          p_currency?: Currency | null;
          p_type?: TransactionType | null;
          p_category_id?: string | null;
          p_from?: string | null;
          p_to?: string | null;
          p_sort_by?: string;
          p_sort_dir?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Array<{
          id: string;
          user_id: string;
          category_id: string;
          type: TransactionType;
          currency: Currency;
          amount: number;
          occurred_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
          category_name_en: string;
          category_name_ar: string;
          category_icon: string;
          category_color: string;
          total_count: number;
        }>;
      };
      get_transaction_report_totals: {
        Args: {
          p_query?: string | null;
          p_currency?: Currency | null;
          p_type?: TransactionType | null;
          p_category_id?: string | null;
          p_from?: string | null;
          p_to?: string | null;
        };
        Returns: Array<{
          currency: Currency;
          total_income: number;
          total_expenses: number;
          net: number;
          transaction_count: number;
        }>;
      };
      get_category_distribution: {
        Args: { p_currency: Currency; p_from: string; p_to: string };
        Returns: Array<{
          category_id: string;
          name_en: string;
          name_ar: string;
          icon: string;
          color: string;
          total: number;
          percentage: number;
        }>;
      };
      get_monthly_expenses: {
        Args: { p_currency: Currency; p_from: string; p_to: string };
        Returns: Array<{ month: string; total: number }>;
      };
      get_balance_history: {
        Args: { p_currency: Currency; p_from: string; p_to: string };
        Returns: Array<{ date: string; balance: number }>;
      };
      get_period_totals: {
        Args: { p_currency: Currency; p_from: string; p_to: string };
        Returns: Array<{
          total_income: number;
          total_expenses: number;
          net: number;
        }>;
      };
    };
    Enums: {
      currency_code: Currency;
      transaction_kind: TransactionType;
      category_kind: CategoryType;
      app_language: AppLanguage;
      app_theme: AppTheme;
    };
    CompositeTypes: Record<string, never>;
  };
}
