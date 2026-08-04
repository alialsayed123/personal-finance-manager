# Personal Finance Manager — Implementation Guide

## Step 1 — Project architecture

The application uses the Next.js 16 App Router. Server Components own authenticated reads, Client Components own interactive controls, and Server Actions own mutations. Supabase is the permanent data store and authentication provider.

```text
src/
├── app/
│   ├── (auth)/login/                 # Email/password login
│   ├── (dashboard)/
│   │   ├── dashboard/                # Summary cards and recent activity
│   │   ├── transactions/             # Search, filters, CRUD, pagination
│   │   ├── statistics/               # Period analytics and Recharts
│   │   ├── budgets/                  # Monthly USD/SYP budgets
│   │   ├── reports/                  # Date ranges and exports
│   │   └── settings/                 # Theme and language
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                            # shadcn/ui-style primitives
│   ├── layout/                        # Sidebar, header, page shell
│   ├── dashboard/
│   ├── transactions/
│   ├── statistics/
│   ├── budgets/
│   ├── reports/
│   ├── settings/
│   └── providers/
├── features/                         # Server Actions by business capability
│   ├── auth/
│   ├── categories/
│   ├── finance/
│   ├── transactions/
│   ├── budgets/
│   └── settings/
├── hooks/                            # Reusable client hooks
├── services/                         # Server-side data access and aggregation
├── lib/
│   ├── supabase/                      # Browser, server, and proxy clients
│   ├── validation/                    # Zod schemas
│   ├── i18n/                          # English and Arabic JSON dictionaries
│   ├── auth.ts
│   ├── date-ranges.ts
│   ├── mappers.ts
│   └── utils.ts
├── stores/                            # Zustand UI state
└── types/                             # Domain and database types

supabase/
└── migrations/                        # PostgreSQL schema, RLS, indexes, RPCs
```

### Architectural decisions

- Currency is an enum on every transaction and budget row.
- USD and SYP are never converted, summed together, or shown as one monetary total.
- Dashboard cards that cover both currencies render two independent values.
- Server Components fetch initial page data to reduce client JavaScript.
- Recharts and export libraries are loaded only when needed.
- Mutations use Server Actions and `router.refresh()`, so the UI updates without a browser page reload.
- Zustand stores transient UI state only. Financial records always come from Supabase.

## Step 2 — Database schema

Run:

```text
supabase/migrations/202608030001_initial_schema.sql
```

The migration creates:

- `categories`
- `transactions`
- `budgets`
- `user_settings`
- PostgreSQL enums for currency, transaction type, language, and theme
- foreign keys, checks, unique constraints, targeted B-tree indexes, and trigram search indexes
- row-level security policies on every private table
- an auth trigger that seeds default income and expense categories
- RPC functions for dashboard summaries, searching, report totals, category distribution, monthly spending, balance history, and period totals

### Important database constraints

- Amounts must be positive.
- A transaction category must belong to the same user.
- A category type must match the transaction type.
- One budget can exist per user, currency, and month.
- Default categories cannot be deleted through RLS.

## Step 3 — Authentication

Authentication uses Supabase email/password login.

1. Open Supabase Authentication.
2. Disable public user sign-up.
3. Create the single personal account manually.
4. Set the same email in `ALLOWED_EMAIL`.
5. Add the Supabase URL and publishable key to `.env.local`.

The Next.js 16 root `proxy.ts` refreshes Supabase SSR cookies and protects dashboard routes. The login Server Action also enforces the email allowlist.

## Step 4 — Dashboard

The dashboard reads `get_dashboard_summary` and renders:

- current USD balance
- current SYP balance
- today expenses, separated by currency
- weekly expenses, separated by currency
- monthly expenses, separated by currency
- remaining monthly budget, separated by currency
- recent transactions
- USD and SYP budget progress

## Step 5 — Transactions

The transaction module includes:

- global floating quick-add dialog
- income/expense type
- independent USD/SYP selection
- category, amount, date, and optional notes
- edit and delete actions
- custom category creation and safe deletion
- server-side search across category, amount, currency, notes, and date
- currency, type, category, and date filters
- indexed sorting and pagination

## Step 6 — Statistics

Statistics support daily, weekly, monthly, and yearly ranges for one selected currency at a time.

Charts:

- pie chart: expense category distribution
- bar chart: monthly expenses
- line chart: cumulative balance history

Recharts is dynamically imported to keep the initial route bundle smaller.

## Step 7 — Budgets

A monthly budget can be stored independently for USD and SYP.

States:

- below 80%: healthy
- 80% to below 100%: warning
- 100% or more: danger

Budget values are upserted on the unique `(user_id, currency, month)` constraint.

## Step 8 — Reports

Report presets:

- today
- this week
- this month
- this year
- custom date range

Reports retain independent totals per currency and support PDF, Excel, and CSV export.

- PDF uses browser-rendered HTML capture, which preserves Arabic text and RTL layout.
- Excel includes transaction and summary sheets.
- CSV includes a UTF-8 BOM for reliable Arabic compatibility.

The interactive table remains paginated. Excel and CSV exports are capped at 10,000 rows; PDF exports are capped at 500 rows and rendered in fixed-size page batches to control browser memory use.

## Step 9 — Settings

Settings are stored permanently in `user_settings`:

- English or Arabic
- light, dark, or system theme
- application timezone configured by `NEXT_PUBLIC_APP_TIME_ZONE` and mirrored to settings when saved

Arabic switches the dashboard shell to RTL immediately.

## Step 10 — Deployment

### Supabase

1. Create the production project.
2. Run the SQL migration.
3. Create the single user.
4. Disable public sign-up.
5. Copy the project URL and publishable key.

### Vercel

1. Push the repository to a private Git provider repository.
2. Import it into Vercel.
3. Add these environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ALLOWED_EMAIL
NEXT_PUBLIC_APP_TIME_ZONE
```

4. Deploy.
5. Add the production site URL to Supabase Authentication URL configuration.

### Verification checklist

```bash
npm run typecheck
npm run lint
npm run build
```

Then verify:

- unauthenticated requests redirect to `/login`
- a non-allowlisted account cannot access the dashboard
- USD changes do not modify any SYP total
- SYP changes do not modify any USD total
- all CRUD actions update without a full page reload
- RLS blocks access to rows owned by another user
- Arabic layout is RTL and exports retain readable Arabic text
- mobile navigation, dialogs, tables, and charts remain usable at narrow widths
