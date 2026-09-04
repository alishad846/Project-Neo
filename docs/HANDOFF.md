# Neo — Team Handoff & Setup Guide

This is the practical guide for getting Neo running end-to-end on your machine and
understanding how the pieces fit. For the product vision, read the root
[`README.md`](../README.md) first — this doc is the "how do I run it" companion.

**Branch:** everything below assumes the `developer` branch.

---

## 1. What Neo is (one paragraph)

Neo is a **compiler for e-commerce catalogues**. A seller keeps one canonical
**Product Genome**; Neo compiles it into marketplace-shaped listings (Meesho first,
Amazon/Flipkart next), autofills the marketplace form for them, manages prices in
bulk with a reversible dry-run, and ships free browser tools. It's a **monorepo**:
a marketing website, a Chrome extension, a NestJS backend, and a local AI extractor —
all sharing typed contracts.

---

## 2. What's in the box (features)

### Marketing website (`apps/web`, React 19 + Vite + Tailwind v4)
- Cartoon/comic design system: warm off-white grid canvas, square panels with hard
  offset "comic" shadows, hand-inked side vignette. Fonts: **Whoa Sauce** (signature
  display), **Magic Cookie** (section titles), **Hogfish** (body/numbers).
- Landing sections: hero, "how it works", live **genome → marketplace compile** demo,
  a **large autoplaying product demo video**, an **interactive bulk price manager**,
  a **free-tools showcase**, launch pricing, and a final CTA.
- **Interactive price manager** (the "Change 500 prices" section): move a discount
  slider / GST / round-to-₹99 / floor-at-breakeven and every price + margin updates
  live; **Apply** commits, **Previous** undoes. (Front-end demo of the real engine.)
- **Free tools** (`/tools`): profit & breakeven calculator, GST calculator, PDF label
  crop, PDF label merge — all run in the browser, no upload.
- **Login / Sign up** (`/login`, `/signup`): wired to the backend auth (see §5).
- Legal pages, custom animated 404, cookie-consent banner, SEO metadata + sitemap,
  and a smooth **scroll-to-top page transition** on navigation.

### Chrome extension (`apps/extension`, WXT / Manifest V3)
- Side panel with **Catalogue**, **Price Manager**, and **AI Composer** tabs, behind a
  **login gate** (same accounts as the website — see §5).
- **AI Composer**: photo → local extraction → compiled Meesho preview → edit → publish,
  with a reversible "Previous" (undo).
- **Config-driven Meesho autofill**: fills the Add-Product form field by field and
  stops at Submit for the seller to review (never auto-submits).

### Backend (`apps/backend`, NestJS + Drizzle ORM + Postgres)
- `auth` — signup/login, bcrypt password hashing, JWT, Postgres `sellers` table.
- `products` — CRUD + append-only history + rollback + archive/restore.
- `pricing` — effective-dated margin/breakeven/dry-run math, snapshot-based apply/undo.
- `transactions` — reversible, snapshot-backed mutations.
- `ai` — extraction/publish/undo, talking to the local extractor (no paid APIs).

### AI extractor (`services/extractor`, Dockerised)
- Local, **free** vision extraction (Ollama + `moondream`) with a heuristic fallback.
  No third-party paid API is ever called.

### Shared packages (`packages/*`)
- `@neo/genome` (canonical Zod schema), `@neo/adapter` + `@neo/adapter-meesho`
  (marketplace compile/validate contracts), `@neo/rules-engine` (pure pricing math),
  `@neo/ui` (shared cartoon components + fonts).

---

## 3. How it fits together (data flow)

```
             ┌──────────────┐         ┌──────────────────────┐
 seller  →   │ apps/web     │  login  │ apps/backend (Nest)  │
 (browser)   │ (marketing + │────────▶│  /auth  /products    │
             │  login/tools)│         │  /pricing  /ai       │
             └──────────────┘         └─────────┬────────────┘
                                                │ Drizzle
             ┌──────────────┐  /auth  ┌─────────▼────────────┐
 seller  →   │ apps/extension│───────▶│  Postgres (Docker)   │  ← the `sellers`
 (Meesho tab)│  side panel   │        │  port 5433           │     table is the wall
             └──────┬───────┘         └──────────────────────┘
                    │ /ai/extract
                    ▼
             ┌──────────────────────┐
             │ services/extractor   │  (Ollama + moondream, local, free)
             └──────────────────────┘
```

**The account wall:** accounts are created on the website (`/signup`) and stored in
the backend's Postgres `sellers` table. The extension's login gate hits the *same*
`/auth/login`, so **only accounts made through Neo unlock the extension** — a wrong
password or an unknown email is rejected (401).

---

## 4. Setup — from a fresh clone to a running stack

### Prerequisites
- **Node 20+** and **pnpm 9+** (`npm i -g pnpm`)
- **Docker Desktop** (for Postgres, and optionally Redis/MinIO/Ollama/extractor)
- **Google Chrome** (to load the extension unpacked)
- (Optional, for real AI extraction) an NVIDIA GPU; a CPU fallback works too.

### Step 1 — get the code
```bash
git clone <repo-url> Project-Neo
cd Project-Neo
git checkout developer
git pull origin developer
pnpm install            # installs the whole monorepo
```

### Step 2 — start the datastores (Docker only — never a native Postgres)
```bash
docker compose -f infra/docker-compose.yml up -d postgres
# for the full stack (AI composer, storage): add redis minio ollama extractor
# docker compose -f infra/docker-compose.yml up -d postgres redis minio ollama extractor
```
Postgres is published on **host port 5433** (a native Postgres often owns 5432 —
always use Docker/5433).

### Step 3 — configure + migrate + seed the backend
```bash
cp apps/backend/.env.example apps/backend/.env      # DATABASE_URL → localhost:5433
pnpm --filter @neo/backend db:migrate               # creates tables incl. `sellers`
pnpm --filter @neo/backend seed                     # 10 sample products (optional)
```

### Step 4 — run the backend (http://localhost:3000)
```bash
pnpm --filter @neo/backend build
pnpm --filter @neo/backend start:prod
# or, for hot reload during dev:
# pnpm --filter @neo/backend start:dev
```

### Step 5 — run the website (http://localhost:5173 in dev)
```bash
pnpm --filter @neo/web dev
# production preview instead: pnpm --filter @neo/web build && pnpm --filter @neo/web preview  (→ :4173)
```
If your backend isn't on `http://localhost:3000`, set `VITE_API_URL` before building
the web app (e.g. `VITE_API_URL=http://localhost:3000 pnpm --filter @neo/web dev`).

### Step 6 — load the extension in Chrome
```bash
pnpm --filter @neo/extension build      # outputs apps/extension/.output/chrome-mv3
```
Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked**
→ select `apps/extension/.output/chrome-mv3`. (For live dev with reload use
`pnpm --filter @neo/extension dev`.)

### Step 7 — verify the account wall end-to-end
1. Open the website → **Sign up** (`/signup`) → create an account.
2. Confirm it landed in Postgres:
   ```bash
   docker exec -it infra-postgres-1 psql -U neo -d neo -c "select email, shop_name from sellers;"
   ```
3. Open the extension side panel → log in with the **same** email/password → you're in.
4. A password/email that was never registered on the site is rejected — that's the wall.

---

## 5. Auth / the wall (details)

- Endpoints: `POST /auth/signup` `{fullName, shopName, email, password}` and
  `POST /auth/login` `{email, password}` → `{ access_token, user }`.
- Passwords are bcrypt-hashed; the JWT is signed with `JWT_SECRET`
  (defaults to a dev secret — **set a real `JWT_SECRET` before any public deploy**).
- Website client: `apps/web/src/lib/auth.ts`. Extension client:
  `apps/extension/entrypoints/sidepanel/auth.ts`. Both point at the same backend, so
  the `sellers` table is the single source of truth.

---

## 6. Handy commands & troubleshooting

| Task | Command |
|---|---|
| Typecheck everything | `pnpm typecheck` |
| Build everything | `pnpm build` |
| Run tests | `pnpm test` |
| Reset the DB | `docker compose -f infra/docker-compose.yml down` (add `-v` to wipe volumes), then re-migrate |
| See backend routes | check the boot log — it prints every mapped route |

- **Web login says "Can't reach the Neo server"** → the backend isn't running on
  `:3000`, or `VITE_API_URL` is wrong. Start the backend (Step 4).
- **Cookie banner won't reappear** → it's remembered in `localStorage`
  (`neo-cookie-consent`). Clear site data / that key to see it again.
- **Migrations fail** → make sure the Postgres container is healthy
  (`docker exec infra-postgres-1 pg_isready -U neo`) and `.env` points at `:5433`.
- **AI extraction returns heuristic-only** → the `ollama`/`extractor` containers
  aren't up, or the `moondream` model isn't pulled (`ollama pull moondream`). The
  heuristic fallback still works without them.

---

## 7. Ground rules (please keep to these)

- **No paid third-party APIs** anywhere — AI stays on the local free extractor.
- **All datastores in Docker** — never point at a native Postgres; the port is 5433.
- **Shared contracts** (`packages/genome`, `packages/adapter`) change by explicit
  decision, not casually — they're the whole point of the architecture.
- Account-safety in the extension: fill every field, then **stop at Submit** — never
  auto-submit into a live marketplace account.
