# Personal Finance Manager

A private, single-user personal finance dashboard built with Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui patterns, Supabase, Recharts, React Hook Form, Zod, and Zustand.

## Features

- Independent USD and SYP balances, budgets, statistics, and reports
- Email/password authentication with an optional single-email allowlist
- Income and expense transactions with custom categories
- Dashboard summaries and recent activity
- Daily, weekly, monthly, and yearly statistics
- Monthly budgets with 80% warning and 100% danger states
- PDF, Excel, and CSV report exports
- English and Arabic UI with RTL support
- Light, dark, and system themes
- PostgreSQL RLS, indexes, constraints, and optimized RPC functions

## Setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/migrations/202608030001_initial_schema.sql`.
3. In Supabase Authentication, create your single user and disable public sign-ups.
4. Copy `.env.example` to `.env.local` and add your Supabase values and allowed email.
5. Install dependencies and run the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production checks

```bash
npm run typecheck
npm run lint
npm run build
```

See `docs/IMPLEMENTATION.md` for the full architecture and deployment guide.
