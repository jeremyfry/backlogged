# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BACKLOGGED is a self-hosted, single-user retro game collection tracker (React + Express + SQLite). It pulls cover art/metadata from IGDB and time-to-beat estimates from HowLongToBeat.

## Commands

npm workspaces root: `frontend`, `backend`, `packages/types`.

```bash
npm install              # install all workspaces
npm run dev               # backend (:3001 via tsx watch) + frontend (:5173 via Vite) concurrently
npm run build              # builds packages/types -> frontend -> backend, in that order
npm test                   # backend vitest + frontend vitest (each is `vitest run`, not watch)
npm run test:e2e           # Playwright, boots real backend + frontend dev servers itself
```

Per-workspace (run with `-w backend` / `-w frontend`, or `cd` into the workspace):

```bash
npm run test:watch -w backend       # vitest watch mode
vitest run src/routes/games.test.ts # single backend test file
vitest run -t "test name"           # single test by name

npm run db:generate -w backend      # generate a Drizzle migration from schema.ts changes
npm run db:push -w backend          # push schema directly to SQLite (dev only)
npm run db:studio -w backend        # Drizzle Studio GUI
```

There is no lint script configured. `tsc` (via each workspace's `build`) is the type-check gate; TypeScript is `strict` throughout (`tsconfig.base.json`).

E2E tests (`e2e/*.spec.ts`) use a temp SQLite DB/config per run (see `playwright.config.ts`) and expect the backend on `:3000`, frontend dev server on `:5173`. They are not part of `npm test`.

## Architecture

**Workspaces**: `frontend`, `backend`, `packages/types` (shared TS types, imported as `@backlogged/types`). Any change to a request/response shape should update `packages/types/src/index.ts` first — both frontend API clients and backend routes/services import from it, so it's the contract between them.

**Backend** (`backend/src`), layered `routes -> services -> db`:
- `routes/*.ts` — Express routers, handle HTTP concerns (parsing, status codes) and auth (`requireAuth` middleware, JWT-based, single user). Route handlers are wrapped in `asyncHandler` for error propagation to the global error middleware in `app.ts`.
- `services/*.ts` — business logic and Drizzle queries. Every service function takes an optional `dbInstance` parameter defaulting to the module-level `db` — this is how tests inject an isolated in-memory/temp DB instead of mocking the ORM.
- `db/schema.ts` — single `games` table; a game's ownership (`owned`/`wishlist`/`digital`) and completion status (`unplayed`/`up_next`/`in_progress`/`completed`/`dropped`) are just fields, not separate tables (see `PROJECT_PLAN.md` decisions log for why). Backlog ordering is a nullable `backlogPosition` int on the same row — a game enters the backlog by getting `completionStatus: 'up_next'`, which auto-assigns the next position (see `nextBacklogPosition` in `services/games.ts`); moving away from `up_next` clears it.
- `db/migrations/` — Drizzle-generated SQL migrations, applied automatically on server startup (`runMigrations()` in `index.ts`) via `better-sqlite3`. After editing `schema.ts`, run `db:generate` to produce a new migration — don't hand-write schema changes.
- `config.ts` — auth config (username + bcrypt hash) lives in a JSON file on disk (`data/config.json` by default), not in the SQLite DB. Password reset works by dropping a `data/reset-pass.txt` file that's read and deleted on next startup (see README for format).
- External integrations: `services/igdb.ts` (Twitch OAuth client-credentials flow for IGDB search/metadata) and `services/hltb.ts` (unofficial HowLongToBeat scraping). Both are optional — routes degrade gracefully if `IGDB_CLIENT_ID`/`SECRET` are unset.
- In production (`NODE_ENV=production`), `app.ts` serves the built frontend as static files and falls back to `index.html` for client-side routing; in dev, Vite's dev server proxies `/api` to the backend instead.

**Frontend** (`frontend/src`):
- `api/*.ts` — thin wrappers around `apiFetch` (`api/client.ts`), which attaches the JWT from `localStorage`, and on a 401 clears the token and dispatches a global `auth:logout` event (picked up by `AuthContext`) rather than each call site handling expiry.
- `context/AuthContext.tsx` — holds the token; `App.tsx` gates all routes except `/login` behind having a token (no server-side route protection beyond the API's own `requireAuth`).
- `pages/` — one per list view (`Collection` = owned games, `Wishlist`, `Backlog` = the `up_next` drag-and-drop queue via `@dnd-kit`), plus `Settings`.
- `components/AddGameSheet.tsx` / `GameDetailSheet.tsx` / `GameForm.tsx` — the shared add/edit/view flow used across all three list pages, backed by IGDB search (`Combobox`) for autofill.
- Data fetching/caching is via TanStack Query (`QueryClient` configured in `App.tsx`); there is no separate global store beyond that and `AuthContext`.

**Testing conventions**: backend route tests mock the service layer (`vi.mock('../../services/...')`) and drive requests through `supertest`; service tests exercise real Drizzle queries against a throwaway DB via `createDb`. Frontend tests use Vitest + React Testing Library with `jsdom` (`frontend/src/test/setup.ts`).

**Deploy**: single Node process serving both API and built frontend, SQLite on a local volume, no external services required. `scripts/install.sh` is the deploy path (Node 22 + systemd service on a bare server/LXC container) — there is no Docker/Dockerfile in this repo.
