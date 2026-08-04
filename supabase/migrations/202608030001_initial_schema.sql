begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.currency_code as enum ('USD', 'SYP');
create type public.transaction_kind as enum ('income', 'expense');
create type public.category_kind as enum ('income', 'expense');
create type public.app_language as enum ('en', 'ar');
create type public.app_theme as enum ('light', 'dark', 'system');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.category_kind not null,
  name_en varchar(60) not null,
  name_ar varchar(60) not null,
  icon varchar(20) not null default 'CircleDollarSign',
  color varchar(7) not null default '#64748b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint categories_user_type_name_unique unique (user_id, type, name_en)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  type public.transaction_kind not null,
  currency public.currency_code not null,
  amount numeric(18, 2) not null check (amount > 0),
  occurred_at date not null default current_date,
  notes varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency public.currency_code not null,
  month date not null check (month = date_trunc('month', month)::date),
  amount numeric(18, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_user_currency_month_unique unique (user_id, currency, month)
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language public.app_language not null default 'en',
  theme public.app_theme not null default 'system',
  timezone text not null default 'Asia/Damascus',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_occurred_at_idx
  on public.transactions (user_id, occurred_at desc, created_at desc);
create index transactions_user_currency_occurred_at_idx
  on public.transactions (user_id, currency, occurred_at desc);
create index transactions_user_type_occurred_at_idx
  on public.transactions (user_id, type, occurred_at desc);
create index transactions_user_category_occurred_at_idx
  on public.transactions (user_id, category_id, occurred_at desc);
create index transactions_user_amount_idx
  on public.transactions (user_id, amount);
create index categories_user_type_idx
  on public.categories (user_id, type, name_en);
create index categories_name_en_trgm_idx
  on public.categories using gin (name_en gin_trgm_ops);
create index categories_name_ar_trgm_idx
  on public.categories using gin (name_ar gin_trgm_ops);
create index transactions_notes_trgm_idx
  on public.transactions using gin (notes gin_trgm_ops)
  where notes is not null;
create index budgets_user_month_idx
  on public.budgets (user_id, month desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create or replace function public.validate_transaction_category()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  selected_category_type public.category_kind;
begin
  select c.type
    into selected_category_type
  from public.categories c
  where c.id = new.category_id
    and c.user_id = new.user_id;

  if selected_category_type is null then
    raise exception 'Category does not belong to the authenticated user.';
  end if;

  if selected_category_type::text <> new.type::text then
    raise exception 'Category type must match transaction type.';
  end if;

  return new;
end;
$$;

create trigger transactions_validate_category
before insert or update of category_id, type, user_id on public.transactions
for each row execute function public.validate_transaction_category();

create or replace function public.protect_category_default_flag()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_default is distinct from old.is_default then
    raise exception 'The default category flag cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger categories_protect_default_flag
before update of is_default on public.categories
for each row execute function public.protect_category_default_flag();

create or replace function public.seed_user_defaults_for(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id, language, theme, timezone)
  values (
    p_user_id,
    'en',
    'system',
    coalesce(nullif(current_setting('app.default_timezone', true), ''), 'Asia/Damascus')
  )
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, type, name_en, name_ar, icon, color, is_default)
  values
    (p_user_id, 'expense', 'Food', 'طعام', 'Utensils', '#f97316', true),
    (p_user_id, 'expense', 'Transport', 'مواصلات', 'Car', '#3b82f6', true),
    (p_user_id, 'expense', 'Shopping', 'تسوق', 'ShoppingBag', '#ec4899', true),
    (p_user_id, 'expense', 'Bills', 'فواتير', 'ReceiptText', '#eab308', true),
    (p_user_id, 'expense', 'Internet', 'انترنت', 'Wifi', '#06b6d4', true),
    (p_user_id, 'expense', 'Phone', 'هاتف', 'Smartphone', '#8b5cf6', true),
    (p_user_id, 'expense', 'Health', 'صحة', 'HeartPulse', '#ef4444', true),
    (p_user_id, 'expense', 'Entertainment', 'ترفيه', 'Clapperboard', '#a855f7', true),
    (p_user_id, 'expense', 'Travel', 'سفر', 'Plane', '#0ea5e9', true),
    (p_user_id, 'expense', 'Education', 'تعليم', 'GraduationCap', '#14b8a6', true),
    (p_user_id, 'expense', 'Work', 'عمل', 'BriefcaseBusiness', '#64748b', true),
    (p_user_id, 'expense', 'Family', 'عائلة', 'UsersRound', '#f43f5e', true),
    (p_user_id, 'expense', 'Other', 'اخرى', 'CircleEllipsis', '#78716c', true),
    (p_user_id, 'income', 'Salary', 'راتب', 'WalletCards', '#22c55e', true),
    (p_user_id, 'income', 'Freelance', 'عمل حر', 'Laptop', '#10b981', true),
    (p_user_id, 'income', 'Bonus', 'مكافاة', 'Sparkles', '#84cc16', true),
    (p_user_id, 'income', 'Investment', 'استثمار', 'ChartNoAxesCombined', '#059669', true),
    (p_user_id, 'income', 'Gift', 'هدية', 'Gift', '#d946ef', true),
    (p_user_id, 'income', 'Other', 'اخرى', 'CircleEllipsis', '#78716c', true)
  on conflict (user_id, type, name_en) do nothing;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_user_defaults_for(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.ensure_user_defaults()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  perform public.seed_user_defaults_for(current_user_id);
end;
$$;

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.user_settings enable row level security;

create policy categories_select_own
  on public.categories for select
  using ((select auth.uid()) = user_id);
create policy categories_insert_own
  on public.categories for insert
  with check ((select auth.uid()) = user_id and is_default = false);
create policy categories_update_own
  on public.categories for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy categories_delete_own_custom
  on public.categories for delete
  using ((select auth.uid()) = user_id and is_default = false);

create policy transactions_select_own
  on public.transactions for select
  using ((select auth.uid()) = user_id);
create policy transactions_insert_own
  on public.transactions for insert
  with check ((select auth.uid()) = user_id);
create policy transactions_update_own
  on public.transactions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy transactions_delete_own
  on public.transactions for delete
  using ((select auth.uid()) = user_id);

create policy budgets_select_own
  on public.budgets for select
  using ((select auth.uid()) = user_id);
create policy budgets_insert_own
  on public.budgets for insert
  with check ((select auth.uid()) = user_id);
create policy budgets_update_own
  on public.budgets for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy budgets_delete_own
  on public.budgets for delete
  using ((select auth.uid()) = user_id);

create policy user_settings_select_own
  on public.user_settings for select
  using ((select auth.uid()) = user_id);
create policy user_settings_insert_own
  on public.user_settings for insert
  with check ((select auth.uid()) = user_id);
create policy user_settings_update_own
  on public.user_settings for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.get_dashboard_summary(p_today date)
returns table (
  currency public.currency_code,
  balance numeric,
  today_expenses numeric,
  weekly_expenses numeric,
  monthly_expenses numeric,
  budget_amount numeric,
  remaining_budget numeric,
  budget_percentage numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with currency_list as (
    select unnest(enum_range(null::public.currency_code)) as currency
  ),
  transaction_summary as (
    select
      t.currency,
      coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0) as balance,
      coalesce(sum(case when t.type = 'expense' and t.occurred_at = p_today then t.amount else 0 end), 0) as today_expenses,
      coalesce(sum(case
        when t.type = 'expense'
          and t.occurred_at between date_trunc('week', p_today::timestamp)::date and p_today
        then t.amount else 0 end), 0) as weekly_expenses,
      coalesce(sum(case
        when t.type = 'expense'
          and t.occurred_at between date_trunc('month', p_today::timestamp)::date and p_today
        then t.amount else 0 end), 0) as monthly_expenses
    from public.transactions t
    where t.user_id = auth.uid()
    group by t.currency
  ),
  budget_summary as (
    select b.currency, b.amount
    from public.budgets b
    where b.user_id = auth.uid()
      and b.month = date_trunc('month', p_today::timestamp)::date
  )
  select
    cl.currency,
    coalesce(ts.balance, 0)::numeric,
    coalesce(ts.today_expenses, 0)::numeric,
    coalesce(ts.weekly_expenses, 0)::numeric,
    coalesce(ts.monthly_expenses, 0)::numeric,
    coalesce(bs.amount, 0)::numeric,
    (coalesce(bs.amount, 0) - coalesce(ts.monthly_expenses, 0))::numeric,
    case
      when coalesce(bs.amount, 0) <= 0 then 0::numeric
      else round((coalesce(ts.monthly_expenses, 0) / bs.amount) * 100, 2)
    end
  from currency_list cl
  left join transaction_summary ts on ts.currency = cl.currency
  left join budget_summary bs on bs.currency = cl.currency
  order by cl.currency;
$$;

create or replace function public.search_transactions(
  p_query text default null,
  p_currency public.currency_code default null,
  p_type public.transaction_kind default null,
  p_category_id uuid default null,
  p_from date default null,
  p_to date default null,
  p_sort_by text default 'occurred_at',
  p_sort_dir text default 'desc',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  user_id uuid,
  category_id uuid,
  type public.transaction_kind,
  currency public.currency_code,
  amount numeric,
  occurred_at date,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  category_name_en text,
  category_name_ar text,
  category_icon text,
  category_color text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as (
    select
      t.id,
      t.user_id,
      t.category_id,
      t.type,
      t.currency,
      t.amount,
      t.occurred_at,
      t.notes::text,
      t.created_at,
      t.updated_at,
      c.name_en::text as category_name_en,
      c.name_ar::text as category_name_ar,
      c.icon::text as category_icon,
      c.color::text as category_color,
      count(*) over() as total_count
    from public.transactions t
    join public.categories c
      on c.id = t.category_id
      and c.user_id = t.user_id
    where t.user_id = auth.uid()
      and (p_currency is null or t.currency = p_currency)
      and (p_type is null or t.type = p_type)
      and (p_category_id is null or t.category_id = p_category_id)
      and (p_from is null or t.occurred_at >= p_from)
      and (p_to is null or t.occurred_at <= p_to)
      and (
        nullif(trim(p_query), '') is null
        or c.name_en ilike '%' || trim(p_query) || '%'
        or c.name_ar ilike '%' || trim(p_query) || '%'
        or coalesce(t.notes, '') ilike '%' || trim(p_query) || '%'
        or t.amount::text ilike '%' || trim(p_query) || '%'
        or t.currency::text ilike '%' || trim(p_query) || '%'
        or t.occurred_at::text ilike '%' || trim(p_query) || '%'
      )
  )
  select *
  from filtered
  order by
    case when p_sort_by = 'amount' and p_sort_dir = 'asc' then amount end asc,
    case when p_sort_by = 'amount' and p_sort_dir = 'desc' then amount end desc,
    case when p_sort_by = 'created_at' and p_sort_dir = 'asc' then created_at end asc,
    case when p_sort_by = 'created_at' and p_sort_dir = 'desc' then created_at end desc,
    case when p_sort_by = 'occurred_at' and p_sort_dir = 'asc' then occurred_at end asc,
    case when p_sort_by = 'occurred_at' and p_sort_dir = 'desc' then occurred_at end desc,
    occurred_at desc,
    created_at desc
  limit least(greatest(p_limit, 1), 10000)
  offset greatest(p_offset, 0);
$$;

create or replace function public.get_transaction_report_totals(
  p_query text default null,
  p_currency public.currency_code default null,
  p_type public.transaction_kind default null,
  p_category_id uuid default null,
  p_from date default null,
  p_to date default null
)
returns table (
  currency public.currency_code,
  total_income numeric,
  total_expenses numeric,
  net numeric,
  transaction_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.currency,
    coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0)::numeric as total_income,
    coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0)::numeric as total_expenses,
    coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0)::numeric as net,
    count(*)::bigint as transaction_count
  from public.transactions t
  join public.categories c on c.id = t.category_id and c.user_id = t.user_id
  where t.user_id = auth.uid()
    and (p_currency is null or t.currency = p_currency)
    and (p_type is null or t.type = p_type)
    and (p_category_id is null or t.category_id = p_category_id)
    and (p_from is null or t.occurred_at >= p_from)
    and (p_to is null or t.occurred_at <= p_to)
    and (
      nullif(trim(p_query), '') is null
      or c.name_en ilike '%' || trim(p_query) || '%'
      or c.name_ar ilike '%' || trim(p_query) || '%'
      or coalesce(t.notes, '') ilike '%' || trim(p_query) || '%'
      or t.amount::text ilike '%' || trim(p_query) || '%'
      or t.currency::text ilike '%' || trim(p_query) || '%'
      or t.occurred_at::text ilike '%' || trim(p_query) || '%'
    )
  group by t.currency
  order by t.currency;
$$;

create or replace function public.get_category_distribution(
  p_currency public.currency_code,
  p_from date,
  p_to date
)
returns table (
  category_id uuid,
  name_en text,
  name_ar text,
  icon text,
  color text,
  total numeric,
  percentage numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with grouped as (
    select
      c.id as category_id,
      c.name_en::text,
      c.name_ar::text,
      c.icon::text,
      c.color::text,
      sum(t.amount)::numeric as total
    from public.transactions t
    join public.categories c on c.id = t.category_id and c.user_id = t.user_id
    where t.user_id = auth.uid()
      and t.type = 'expense'
      and t.currency = p_currency
      and t.occurred_at between p_from and p_to
    group by c.id, c.name_en, c.name_ar, c.icon, c.color
  )
  select
    grouped.category_id,
    grouped.name_en,
    grouped.name_ar,
    grouped.icon,
    grouped.color,
    grouped.total,
    case
      when sum(grouped.total) over() = 0 then 0::numeric
      else round((grouped.total / sum(grouped.total) over()) * 100, 2)
    end as percentage
  from grouped
  order by grouped.total desc;
$$;

create or replace function public.get_monthly_expenses(
  p_currency public.currency_code,
  p_from date,
  p_to date
)
returns table (month date, total numeric)
language sql
stable
security invoker
set search_path = public
as $$
  with months as (
    select generate_series(
      date_trunc('month', p_from::timestamp),
      date_trunc('month', p_to::timestamp),
      interval '1 month'
    )::date as month
  ),
  grouped as (
    select
      date_trunc('month', t.occurred_at::timestamp)::date as month,
      sum(t.amount)::numeric as total
    from public.transactions t
    where t.user_id = auth.uid()
      and t.type = 'expense'
      and t.currency = p_currency
      and t.occurred_at between p_from and p_to
    group by date_trunc('month', t.occurred_at::timestamp)::date
  )
  select months.month, coalesce(grouped.total, 0)::numeric
  from months
  left join grouped using (month)
  order by months.month;
$$;

create or replace function public.get_balance_history(
  p_currency public.currency_code,
  p_from date,
  p_to date
)
returns table (date date, balance numeric)
language sql
stable
security invoker
set search_path = public
as $$
  with date_series as (
    select generate_series(p_from, p_to, interval '1 day')::date as date
  ),
  opening as (
    select coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0)::numeric as amount
    from public.transactions t
    where t.user_id = auth.uid()
      and t.currency = p_currency
      and t.occurred_at < p_from
  ),
  daily as (
    select
      t.occurred_at as date,
      sum(case when t.type = 'income' then t.amount else -t.amount end)::numeric as net
    from public.transactions t
    where t.user_id = auth.uid()
      and t.currency = p_currency
      and t.occurred_at between p_from and p_to
    group by t.occurred_at
  )
  select
    ds.date,
    (
      (select amount from opening)
      + sum(coalesce(daily.net, 0)) over (order by ds.date rows unbounded preceding)
    )::numeric as balance
  from date_series ds
  left join daily using (date)
  order by ds.date;
$$;

create or replace function public.get_period_totals(
  p_currency public.currency_code,
  p_from date,
  p_to date
)
returns table (
  total_income numeric,
  total_expenses numeric,
  net numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0)::numeric as total_income,
    coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0)::numeric as total_expenses,
    coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0)::numeric as net
  from public.transactions t
  where t.user_id = auth.uid()
    and t.currency = p_currency
    and t.occurred_at between p_from and p_to;
$$;

revoke all on function public.ensure_user_defaults() from public, anon;
revoke all on function public.get_dashboard_summary(date) from public, anon;
revoke all on function public.search_transactions(text, public.currency_code, public.transaction_kind, uuid, date, date, text, text, integer, integer) from public, anon;
revoke all on function public.get_transaction_report_totals(text, public.currency_code, public.transaction_kind, uuid, date, date) from public, anon;
revoke all on function public.get_category_distribution(public.currency_code, date, date) from public, anon;
revoke all on function public.get_monthly_expenses(public.currency_code, date, date) from public, anon;
revoke all on function public.get_balance_history(public.currency_code, date, date) from public, anon;
revoke all on function public.get_period_totals(public.currency_code, date, date) from public, anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update on public.user_settings to authenticated;
grant execute on function public.ensure_user_defaults() to authenticated;
grant execute on function public.get_dashboard_summary(date) to authenticated;
grant execute on function public.search_transactions(text, public.currency_code, public.transaction_kind, uuid, date, date, text, text, integer, integer) to authenticated;
grant execute on function public.get_transaction_report_totals(text, public.currency_code, public.transaction_kind, uuid, date, date) to authenticated;
grant execute on function public.get_category_distribution(public.currency_code, date, date) to authenticated;
grant execute on function public.get_monthly_expenses(public.currency_code, date, date) to authenticated;
grant execute on function public.get_balance_history(public.currency_code, date, date) to authenticated;
grant execute on function public.get_period_totals(public.currency_code, date, date) to authenticated;

revoke all on function public.seed_user_defaults_for(uuid) from public, anon, authenticated;

commit;
