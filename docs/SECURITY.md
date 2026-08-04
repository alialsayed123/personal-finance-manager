# Security Notes

## Account model

This repository is designed for one private user. Public registration should remain disabled in Supabase. The server-only `ALLOWED_EMAIL` environment variable adds a second application-level restriction beyond authentication.

## Data isolation

Every data table contains `user_id` and has row-level security enabled. Policies restrict select, insert, update, and delete operations to `auth.uid()`.

## Server trust boundary

- Client input is validated again in Server Actions with Zod.
- User IDs are derived from verified Supabase claims and never accepted from the browser.
- Category ownership and category/transaction type compatibility are checked in both application code and a PostgreSQL trigger.
- The Supabase service-role key is not used by the web application.

## Operational recommendations

- Keep the repository private.
- Enable MFA on the Supabase and Vercel administrator accounts.
- Use a strong password for the finance account.
- Review Supabase authentication and database logs periodically.
- Back up the database or enable point-in-time recovery when the project plan supports it.
- Never expose `ALLOWED_EMAIL` as a `NEXT_PUBLIC_` variable.
