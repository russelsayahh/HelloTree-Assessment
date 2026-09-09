# Part B — Maintenance Request Tracker

Clients submit maintenance requests and watch their status. An admin sees every
client's requests, filters them, and moves them forward.

- `api/` — Node + Express + PostgreSQL (raw SQL via `pg`, no ORM)
- `web/` — React + Vite, one page, no router, plain CSS

## Running it

**Prerequisites:** Node 20+ and a running PostgreSQL 14+.

Create the two databases (the second is only used by the test suite):

```bash
createdb hellotree
createdb hellotree_test
```

### API — one command

```bash
cd part-b/api
cp .env.example .env      # then set your PostgreSQL password in it
npm install
npm run db:reset          # creates the schema and loads the demo data
npm run dev               # http://localhost:4000
```

### Web — one command

```bash
cd part-b/web
npm install
npm run dev               # http://localhost:5173
```

Vite proxies `/api` to port 4000, so the API must be running first.

> On npm 12, `npm install` blocks esbuild's postinstall script and Vite will not
> start. If you see that warning, run `npm install-scripts approve esbuild` once.
> npm 10 and 11 are unaffected.

### Tests

```bash
cd part-b/api
npm test
```

`npm run db:reset` is safe to re-run at any time: it drops and recreates
everything, so the 24-hour flag is always visible without waiting a day.

## Demo identities

There is no login, as the brief allows. The switcher in the top right sets a
`X-Demo-User: <user id>` header on every call; the server looks that id up in
the `users` table and takes the role from **the database row**, never from the
frontend. Swapping this middleware (`api/src/identity.js`) for real session or
token verification is the only change real auth would need.

Seeded identities: three clients (Acme Retail, Cedar Bank, Olive Media) and one
admin (Hellotree Admin).

## The three business rules

All three are enforced by the API. The UI reflects them but never decides them.

| Rule | Where |
|---|---|
| Cannot move to Done without a resolution note | `api/src/rules.js` → `checkTransition`, plus a `CHECK` constraint in `schema.sql` |
| Statuses only move forward (`new → in_progress → done`) | `api/src/rules.js` → `ALLOWED_TRANSITIONS` |
| Urgent requests in New for over 24h are flagged | computed in SQL in `api/src/routes/requests.js`, returned as `is_stale` |

Two deliberate details:

- The "Mark done" button is **not** disabled when the note is empty. Pressing it
  sends the request, the API rejects it with `422 RESOLUTION_NOTE_REQUIRED`, and
  the message appears in the UI — so you can see the rule being enforced by the
  server rather than hidden by the form.
- Authorization is applied in the query, not after it. A client's list is
  scoped with `WHERE client_id = $1`, so `?client_id=` from a client is ignored
  rather than filtered out later.

## Schema notes

Two tables, `users` and `requests` (`api/schema.sql`).

`users` holds both the clients and the admin, because identity has to be
resolved from the database and a separate `clients` table would duplicate it.
Filtering by client is therefore filtering by user id.

There is no `status_changed_at` column. Statuses only ever move forward, so
`new` is only ever the initial state — a request sitting in `new` has been
there since it was created, which makes `created_at` the correct clock for the
24-hour rule.

## API

| Method | Path | Who | Notes |
|---|---|---|---|
| `GET` | `/api/health` | anyone | |
| `GET` | `/api/users` | anyone | powers the demo switcher |
| `GET` | `/api/requests` | client / admin | client sees own; admin may pass `?status=` and `?client_id=` |
| `POST` | `/api/requests` | client | `{ title, description, priority }` |
| `PATCH` | `/api/requests/:id/status` | admin | `{ status, resolution_note? }` |

Errors come back as `{ "error": { "code", "message" } }`. `422` for a business
rule, `403` for the wrong role, `401` for a missing or unknown identity.

## What I left out, and why

Cut to stay inside the time budget, in the order I would add them back:

- **Frontend tests.** Every rule that matters is enforced server-side and
  covered there; UI tests would have cost more than they proved here.
- **Status history / audit trail.** Useful in a real tracker, not needed to
  demonstrate the rules.
- **Pagination**, **editing and deleting requests**, **notifications**, and
  **priority filtering** (the brief asks only for status and client).
- **Docker Compose.** Documented two-command startup instead.
