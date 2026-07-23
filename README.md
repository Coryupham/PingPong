# Ping Pong League

A small Next.js app for scoring ping pong games, confirming rostered players with
email + PIN, ranking players with Elo, and letting admins manage the league.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth + Supabase Postgres
- Drizzle ORM + Drizzle Kit migrations
- Tailwind CSS
- Vitest
- Vercel hosting

## Setup

1. Create a Supabase project.
2. Run every SQL file in `supabase/migrations` in filename order.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `DATABASE_URL`
4. Install dependencies and run the app:

```bash
npm install
npm run dev
```

## Database Migrations

The existing database was built with hand-written SQL files in
`supabase/migrations`. Run those files in filename order for the current
baseline.

Drizzle is now configured for schema changes going forward. The first Drizzle
migration is a no-op baseline because the current database already comes from
the SQL files above:

```bash
npm run db:generate
npm run db:migrate
```

Use the Supabase Postgres connection string for `DATABASE_URL`. Keep this value
server-side only; do not expose it with a `NEXT_PUBLIC_` prefix.

Helpful commands:

```bash
npm run db:studio
npm run db:pull
npm run db:push
```

For an existing Supabase database, run `npm run db:migrate` once after applying
the SQL baseline so Drizzle records its no-op baseline. After that, edit
`db/schema.ts`, run `npm run db:generate`, review the generated SQL, and run
`npm run db:migrate`.

## Admin

Players do not log in. Admins log in to `/login`, then add players to the roster
from `/admin`.

After creating the first admin auth account, mark it as admin in Supabase:

```sql
update public.profiles
set is_admin = true
where email = 'you@example.com';
```

## Demo Players

Run `supabase/migrations/004_seed_mock_players.sql` to clear current player,
match, and rating-event data, then seed this test roster:

| Player | Email | PIN |
| --- | --- | --- |
| Alex Ace | alex@example.com | 1111 |
| Bella Backspin | bella@example.com | 2222 |
| Charlie Chop | charlie@example.com | 3333 |
| Daisy Drive | daisy@example.com | 4444 |
| Evan Edge | evan@example.com | 5555 |
| Nina Net | nina@example.com | 6666 |

## Readable Match Records

The database keeps UUID columns for reliable relationships, but newer match
records also store readable snapshot fields such as player names, emails,
winner name/email, and first-server name/email. PINs stay hashed and cannot be
viewed in plaintext.

## Deployment

Push the repo to GitHub, import it into Vercel, attach the same Supabase
environment variables, and deploy.
