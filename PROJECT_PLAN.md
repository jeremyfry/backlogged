# Backlogged — Local Game Catalog

A locally hosted web app to catalog physical video game collection, manage a wishlist, and track a backlog.

---

## Phase 1 — Core Catalog

### Data Model — Game Entry
A single unified game record with a `status` field determining which list it appears in.

**Core Metadata**
- Title
- Platform (NES, SNES, Genesis, PS1, PS2, PS3, PS4, PS5, Switch, etc.)
- Region / Language (English, Japanese, PAL, etc.)
- Genre
- Developer / Publisher
- Release year
- Cover art / box art (fetched from IGDB)
- Personal rating (optional)
- Completion status: `Unplayed` | `In Progress` | `Completed` | `Dropped`
- Time to beat (fetched from HowLongToBeat — main story, extras, completionist)
- Notes (freeform text)

**Physical / Ownership Fields**
- Ownership status: `Owned` | `Wishlist`
- Condition: `Wanted` | `Sealed` | `Complete In Box` | `Loose` | `Incomplete`
  - `Wanted` = no condition preference; available on any game regardless of ownership status
  - Owned games use condition to describe what you have
  - Wishlist games use condition to describe what you're hunting for (or `Wanted` for any)
- Purchase price (optional, owned games)
- Purchase date (optional, owned games)
- Purchase location (optional, owned games)
- Target price (optional, wishlist items)

### Lists / Views
- **Collection** — all owned physical games
  - Search by title
  - Filter by platform, completion status, region/language
  - Sort by title, platform, release year, personal rating
- **Wishlist** — games to acquire; flat list, no priority ranking
- **Backlog** — ordered queue of what to play next; drag-and-drop reordering

### External APIs
- **IGDB** (via Twitch auth) — cover art, box art, game metadata
- **HowLongToBeat** — time to beat (unofficial scraping library; may need maintenance)

### Auth
- Single user
- Simple username/password login, JWT session
- Password stored as bcrypt hash in a config file on the filesystem
- Password reset: edit the config file directly (requires filesystem/SSH access to the server)

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript (strict) | Used throughout frontend and backend |
| Frontend | React + Vite | Mobile-first UI; primarily used on phone for adding items |
| Styling | Tailwind CSS + shadcn/ui | Good mobile components, accessible defaults |
| Backend | Node.js + Express | Simple REST API |
| ORM | Drizzle ORM | Lightweight, TypeScript-native, great SQLite support |
| Database | SQLite | Single file, no separate DB server, easy to back up |
| Auth | JWT (jsonwebtoken + bcrypt) | Password hash in config file; filesystem reset |
| Containerization | Docker + Docker Compose | Deployed on Proxmox |
| Testing (backend) | Vitest | Unit + integration tests for API routes and services |
| Testing (frontend) | Vitest + React Testing Library | Component and interaction tests |
| E2E Testing | Playwright | Critical user flows (add game, login, backlog reorder) |

---

## Phase 2 — Steam Integration & Export

- Import Steam library via Steam Web API
- Include Steam games in backlog / "next to play" view
- Read-only import (no writing back to Steam)
- Data export to JSON and/or CSV from within the app

---

## Open Questions

None — ready to build.

---

## Decisions Log

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2026-03-19 | Language/region field included | Owns Japanese language games |
| 2026-03-19 | Condition includes `Wanted` option | Works for both owned and wishlist; no-preference state |
| 2026-03-19 | Steam integration deferred to Phase 2 | Keep Phase 1 scope manageable |
| 2026-03-19 | Cover art via IGDB | Best data quality, strong retro + JP coverage |
| 2026-03-19 | Time to beat via HowLongToBeat | No play session tracking; HLTB data is sufficient |
| 2026-03-19 | Backlog is a drag-and-drop ordered list | Simple, explicit ordering preferred over tiers |
| 2026-03-19 | Wishlist is flat with no priority | Condition (desired) is the meaningful metadata |
| 2026-03-19 | Unified game record with status field | Owned/Wishlist as a field, not separate tables |
| 2026-03-19 | React + Vite frontend | Mobile-first; primarily used on phone |
| 2026-03-19 | SQLite + Drizzle ORM | Local, single-file DB; no server needed |
| 2026-03-19 | Docker on Proxmox | Self-hosted; accessible across local network |
| 2026-03-19 | Single user with filesystem-based password reset | Simple auth; reset requires SSH/file access |
| 2026-03-19 | Collection supports search, filter, and sort | Title search; filter by platform/status/language; sort by title/platform/year/rating |
| 2026-03-19 | Data export deferred to Phase 2 | SQLite file backup sufficient for Phase 1 |
| 2026-03-19 | TypeScript throughout (strict mode) | Frontend and backend share types |
| 2026-03-19 | Vitest for unit/integration, Playwright for E2E | Consistent test runner; Playwright for critical flows |
