# Ping Pong League

A small Next.js app for scoring ping pong games, confirming opponents with a PIN,
tracking in-app invites, ranking players with Elo, and letting admins correct
scores.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth + Supabase Postgres
- Tailwind CSS
- Vitest
- Vercel hosting

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. Install dependencies and run the app:

```bash
npm install
npm run dev
```

## Admin

After creating the first account, mark it as admin in Supabase:

```sql
update public.profiles
set is_admin = true
where email = 'you@example.com';
```

## Deployment

Push the repo to GitHub, import it into Vercel, attach the same Supabase
environment variables, and deploy.
