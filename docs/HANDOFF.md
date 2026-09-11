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
- Local, **free** vision extraction (Ollama + `qwen2.5vl:3b`) with a heuristic fallback.
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
             │ services/extractor   │  (Ollama + qwen2.5vl:3b, local, free)
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
  aren't up, or neither model is pulled: `ollama pull qwen2.5vl:7b` (quality,
  needs a GPU with ~8GB VRAM for good speed) and `ollama pull qwen2.5vl:3b`
  (fast fallback, CPU-friendly — the extractor races the two automatically,
  see `services/extractor/src/server.ts`, so pull both). The heuristic
  fallback still works without either.

---

## 7. What's new — Bulk Catalogue Wizard + AI Autofill fixes

This section is a walkthrough for anyone picking up the codebase after this round of
work. It explains what changed, why, and how to try it yourself in under ten minutes.

### 7.1 The headline feature: Bulk Catalogue Wizard

**The problem it solves:** Meesho's own bulk-upload flow is genuinely painful by hand.
To list one product in multiple sizes, a seller has to create a shared **Group ID** and
copy it onto every size row, copy the **same image link** onto every one of those rows,
and get every **optional field group** either fully filled or fully empty — a partially
filled optional group fails Meesho's QC. Do that across dozens of SKUs and it's hours of
error-prone copy-pasting.

**What we built:** a two-step wizard in the extension's **Bulk Catalogue** tab that does
all of that automatically.

- **Step 1 — inputs.** The seller uploads Meesho's blank bulk-upload `.xlsx` template and
  pastes product image links (from Meesho's own CDN — Neo can't generate these, only
  Meesho can). Each link is captured as its own **pill** in the input box — paste one,
  it becomes a removable pill and is treated as one SKU; paste another right after
  (even with no space between them) and it's split out into its own pill automatically.
  Before moving on, each link is fetched server-side to make sure it's actually usable —
  broken links are called out so the seller can fix them before wasting time on the form.
- **Step 2 — one form per SKU.** The form's fields are generated **from the uploaded
  template itself** (not hardcoded), so it adapts to whatever category template the
  seller uploads. Fields the AI can usefully read from the photo (colour, pattern) come
  pre-filled; everything else — including manufacturer/packer/importer, which are legal/
  business fields, not visual ones — is left for the seller to fill. From the second SKU
  onward, every field has a small **"same as previous"** toggle so identical values (like
  manufacturer details) can be carried forward with one click instead of retyped.
  Underneath the shared fields is a **variant table**: one row per size/colour/length
  combination, each with its own price, MRP, inventory, and images (front image required,
  up to three more optional) — this is what used to require manual copy-pasting.
- **Generate.** Clicking Generate builds every variant row (shared Group ID, repeated
  image links, per-row pricing), runs it through the same validation Meesho itself would
  apply (required fields, dropdown-allowed values, price-below-MRP ordering, importer
  required-for-non-India, optional-group all-or-nothing), and only then produces the
  ready-to-upload Excel. Each SKU is also saved into **Manage Catalogue** so it can be
  reused later as a reference product.

**Where the code lives** (`apps/extension/entrypoints/sidepanel/components/bulk/`):

| File | Responsibility |
|---|---|
| `BulkWizard.tsx` | Orchestrates the two steps, holds wizard state, drives Generate |
| `Step1Inputs.tsx` | Template upload + the image-link pill input + the fetch/prefill gate |
| `LinkPillInput.tsx` | The reusable tokenizing pill input (used for SKU links and per-variant images) |
| `Step2SkuForm.tsx` | Renders the shared-fields form dynamically from the template's own columns |
| `VariantTable.tsx` | The per-size/colour/length grid with inline price validation |
| `assemble.ts` | **Pure logic, no UI** — turns wizard state into the shape the Excel-writing engine expects. Has its own test suite. |
| `assemble.test.ts`, `assemble.integration.test.ts` | Unit + integration tests for `assemble.ts` |
| `types.ts` | Shared TypeScript types for the wizard |

The actual Excel-writing engine (`apps/extension/lib/meesho/bulk-autofill.js`) already
existed from earlier work; this round wired the wizard UI into it and fixed several of
its validation rules that didn't match real Meesho behaviour (see 7.3).

Backend: a new `POST /ai/extract-url` endpoint (`apps/backend/src/ai/`) fetches a
seller-pasted image link **server-side** — the browser can't do this itself because
Meesho's CDN blocks cross-origin requests — and runs it through the local AI extractor.
It doubles as the "is this link actually usable?" check in Step 1. Because this endpoint
lets an authenticated seller make the server fetch an arbitrary URL, it's hardened
against SSRF: it resolves the DNS and rejects any address that points at localhost,
private/internal IP ranges, or cloud metadata endpoints, follows redirects only after
re-validating each hop, and caps both the fetch time and the response size.

### 7.2 Try it yourself (5–10 minutes)

1. `pnpm start` (see §4) — brings up the whole stack.
2. `chrome://extensions` → reload Project Neo → open a Meesho Add-Catalog tab and
   refresh it (so the content script picks up the new build) → open the side panel.
3. Go to the **Bulk Catalogue** tab.
4. Upload any real Meesho bulk-upload template, then paste 2–3 real
   `upload.meeshosupplyassets.com/...` image links (one after another — watch them turn
   into pills).
5. Click **Continue**. If a link can't be fetched you'll see it flagged immediately.
6. You'll land on SKU 1's form — some fields will already be filled in from the photo.
   Fill the rest, add a variant row or two with different sizes/prices in the table
   below, then **Next** to move to SKU 2 (try the "same as previous" toggles here).
7. Click **Generate**. A ready `.xlsx` downloads, and both SKUs show up in
   **Manage Catalogue**.

To read the actual code changes commit-by-commit instead of all at once:
```bash
git log --oneline 5cd84f3..HEAD          # every commit from this round of work
git show <short-sha>                      # any single commit's full diff
git diff 5cd84f3..HEAD -- apps/extension/entrypoints/sidepanel/components/bulk/
```

Run the wizard's own test suite:
```bash
pnpm --filter @neo/extension exec vitest run     # bulk wizard unit + integration tests
pnpm --filter @neo/backend exec jest src/ai/ai.service.spec.ts   # extract-url tests
```

### 7.3 Other fixes worth knowing about

- **AI Autofill confetti popup was landing in the wrong spot.** It was reading the
  field's position mid-scroll-animation instead of after the scroll finished — fixed by
  using an instant scroll before measuring.
- **Business-details fill failures were being swallowed.** If a manufacturer/packer/
  importer field was found but rejected by Meesho's own form, the fill engine recorded it
  as a failure internally, but the message bridge back to the side panel only forwarded
  "missing" and "skipped" — so the seller saw "completed" even when those fields hadn't
  actually taken. That case is now surfaced too.
- **The AI model was silently not running at all.** A recent change told Ollama to keep
  the vision model loaded in memory using `keep_alive: "-1"` — but Ollama only accepts
  that as a **number**, not a string, so the request errored every time and every
  extraction silently fell back to a much weaker heuristic with no one the wiser. Fixed
  by sending it as a number. Worth knowing about if extraction quality ever looks
  suspiciously bad again — check `docker logs infra-extractor-1` for Ollama errors.
- **Extraction now defaults to the lighter 3B vision model** instead of the heavier 7B.
  Only a couple of genuinely visual attributes (colour, pattern) are usefully extracted
  from a product photo — the rest of a Meesho listing is commercial/legal data the seller
  supplies — so the bigger model was pure latency cost for no real accuracy gain here.
- **Sellers were seeing each other's catalogues.** `GET /products` wasn't scoped to the
  logged-in seller, so Manage Catalogue and the AI Autofill "reference SKU" picker showed
  every seller's products, not just your own. Fixed — all product endpoints are now
  seller-scoped.
- **Demo seed data removed.** The database no longer auto-seeds 10 sample products;
  sellers start with an empty catalogue that only contains what they've actually added.
- **`pnpm start` is quiet by default now.** Setup steps (Docker builds, migrations,
  model checks) run silently and only show a short ✓ per step; server logs are hidden
  too. Run `pnpm start --verbose` if you need to see everything for debugging.

## 8. Ground rules (please keep to these)

- **No paid third-party APIs** anywhere — AI stays on the local free extractor.
- **All datastores in Docker** — never point at a native Postgres; the port is 5433.
- **Shared contracts** (`packages/genome`, `packages/adapter`) change by explicit
  decision, not casually — they're the whole point of the architecture.
- Account-safety in the extension: fill every field, then **stop at Submit** — never
  auto-submit into a live marketplace account.
