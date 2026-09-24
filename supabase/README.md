# Database — the part that makes Maya safe

The app's safety does not live in the React code. It lives here, in the database: an ungrounded
recommendation cannot be saved, an out-of-taxonomy action cannot be stored, signals cannot be
edited or deleted, and every event lands on the timeline by a trigger the client cannot skip.
None of this was in the repo before — only the running Supabase project had it — so a fresh clone
could not recreate the guarantees. This folder fixes that.

## Files

| File | What it is |
|---|---|
| `migrations/20260810000000_initial_schema.sql` | The real schema, taken from the production project's own backup (2026-09-04), public schema, Maya's seven tables only. Source of truth. |
| `tests/supabase_stub.sql` | The minimum of Supabase (`anon`/`authenticated`/`service_role` roles and `auth.role()`) so the migration runs on a plain local Postgres. Never run against Supabase itself. |
| `tests/guarantees.sql` | Nine checks that prove each guarantee is enforced by the database, not just the app. |

## Apply it

To a Supabase project (Supabase provides the roles and `auth.*` itself — do **not** load the stub):

```bash
supabase db push          # or: psql "$DATABASE_URL" -f migrations/20260810000000_initial_schema.sql
```

## Prove the guarantees on a throwaway local Postgres

```bash
createdb maya
psql -d maya -v ON_ERROR_STOP=1 -f supabase/tests/supabase_stub.sql
psql -d maya -v ON_ERROR_STOP=1 -f supabase/migrations/20260810000000_initial_schema.sql
psql -d maya -f supabase/tests/guarantees.sql        # expect: ALL GUARANTEES PASSED
```

Verified on PostgreSQL 18, 2026-09-23: migration applies clean (7 tables, 15 policies, 4 triggers,
RLS on all 7); guarantees G1–G7 all PASS.

## What actually shipped vs the spec

`specs/001-customer-success-agent/data-model.md` was written before the build settled. Where they
differ, **this migration is what shipped and what the app talks to**:

- The spec scopes every row per user (`accounts.user_id`, RLS `user_id = auth.uid()`). The shipped
  schema does **not**: `accounts` has no `user_id`, and RLS is `auth.role() = 'authenticated'`.
- The `authenticated` role may `UPDATE` **any** recommendation or outreach draft (policies
  `USING (true)`). The database does not enforce the `pending → decided` transition; only the app's
  flow does.

## Who can see and change what

Maya ships as **one shared demo workspace**. On load, `src/App.tsx` signs every visitor in as the same
demo user (`maya@example.com`, whose password is in the client on purpose), and if that fails, as an
anonymous Supabase user. Both sessions have the `authenticated` role, so every visitor can read every
account, add signals and decisions, and update any recommendation or draft.

That is intended for a public demo of fictional accounts. It is **not** safe for real customer data.
Before any goes in:

1. Give `accounts` an owner: `owner_id uuid not null default auth.uid()`.
2. Scope every policy through it: `owner_id = auth.uid()` on `accounts`, and on each child table
   `exists (select 1 from accounts a where a.id = account_id and a.owner_id = auth.uid())`. Replace
   the `USING (true)` update policies the same way, and restrict updates to `status = 'pending'` rows.
3. Turn off anonymous sign-ins in the Supabase project and remove the demo credentials from
   `src/App.tsx` in favour of a real sign-in.
