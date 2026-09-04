# Project Neo

Neo is a browser extension (Chrome/Edge, Manifest V3) plus a small backend that
automates catalogue work for Indian e-commerce sellers. It starts with **Meesho**
and is built to expand to **Amazon India** and **Flipkart**.

> **New here / setting up?** Read [`docs/HANDOFF.md`](docs/HANDOFF.md) — it lists every
> feature, how the pieces fit, and step-by-step setup to run the whole stack locally.

A seller with a few hundred SKUs loses 25–38 hours a week to work that creates
nothing new: retyping the same fields into listing forms, reacting to competitor
prices by gut feel, cropping shipping labels, fixing rejected listings, and chasing
payment discrepancies — repeated once per marketplace, because each marketplace wants
the same product described differently. Neo does that translation for them.

## The core idea: a compiler, not a form filler

Every marketplace wants the same product in a different shape. For one plain kurti:

- Meesho wants `Neck Type: "Round Neck"`
- Amazon wants `neck_style: "Crew Neck"`, plus bullet points and a backend search-terms field
- Flipkart wants `Neck: "Round"` under its own category tree

Today the seller is the human translator. Neo makes that a program:

```
photos / invoice / old listing / voice note
                  |
                  v
          PRODUCT GENOME   (one canonical product record)
                  |
      +-----------+-----------+
      v           v           v
   MEESHO      AMAZON      FLIPKART
  ADAPTER     ADAPTER      ADAPTER
```

- **Product Genome** — the single canonical record holding everything true about a
  product regardless of where it sells: photos, fabric, colour, size run, weight and
  dimensions, COGS, HSN, brand, care instructions, supplier. It is versioned and
  append-only, so undo and audit both work off history.
- **Marketplace Adapter** — one per marketplace. Knows that marketplace's category
  tree, required attributes, character limits, image specs, and how to publish:
  official API where one exists, driving the seller's own browser panel where one
  doesn't. Adding a marketplace is "write one more adapter," not "rebuild the product."

## Repository layout

A Turborepo + pnpm monorepo, TypeScript strict throughout.

```
apps/
  backend/        NestJS + Drizzle API: products, pricing, transactions, ai
  extension/      WXT MV3 browser extension: side panel, content scripts
  web/            Marketing site + live demo (in progress)
packages/
  genome/         Canonical ProductGenome schema (Zod) + types — the shared contract
  adapter/        MarketplaceAdapter interface, Txn, CompiledListing, ValidationIssue
  rules-engine/   Pure, effective-dated margin / commission / tax math
services/
  extractor/      Local vision-model attribute extractor (in progress)
infra/
  docker-compose.yml   Postgres (+pgvector), Redis, MinIO
```

## Tech stack

- **Extension:** WXT (Manifest V3), React + Tailwind, Zustand for local UI state,
  TanStack Query for server state, Dexie for IndexedDB, Zod for runtime validation.
- **Backend:** NestJS, PostgreSQL + Drizzle ORM, pgvector for attribute matching,
  Redis + BullMQ for queues, MinIO / Cloudflare R2 for images.
- **Tooling:** Turborepo, pnpm workspaces, Vitest / Jest, Playwright.

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (all datastores run in containers — no local database is required or used)

### 1. Install

```bash
pnpm install
```

### 2. Start the datastores

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis minio
```

Postgres is published on host port **5433** (chosen to avoid clashing with any
locally installed Postgres on 5432). Redis is on 6379, MinIO on 9000/9001.

### 3. Configure and prepare the database

```bash
cp apps/backend/.env.example apps/backend/.env   # DATABASE_URL points at localhost:5433
pnpm --filter @neo/backend db:migrate
pnpm --filter @neo/backend seed                  # inserts a small demo catalogue
```

### 4. Run the backend

```bash
pnpm --filter @neo/backend start          # http://localhost:3000
```

Key endpoints:

- `GET  /products` — the catalogue
- `POST /pricing/dry-run` — preview a pricing rule as a per-SKU diff
- `POST /pricing/apply` — apply a rule as a reversible transaction
- `POST /pricing/undo/:txnId` — revert an applied transaction

### 5. Run the extension

```bash
pnpm --filter @neo/extension dev
```

Then load `apps/extension/.output/chrome-mv3-dev` at `chrome://extensions`
(Developer mode → Load unpacked) and open the side panel.

## Features

- **Catalogue** — the side panel reads the live catalogue from the backend.
- **Bulk Price Manager** — write a pricing rule (percentage/flat discount, fixed
  price, or target margin, with an optional floor and round-to-.99), preview the
  per-SKU price and margin impact as a dry-run diff, confirm, and apply. Every apply
  is a reversible transaction with one-click undo. The engine computes true net
  margin (COGS, commission, shipping slab, returns, GST) and refuses to silently take
  a price below breakeven.

## Engineering principles

These are treated as correctness requirements, not preferences:

1. **Every mutation is a reversible transaction.** Live marketplace/catalogue writes
   snapshot prior state first; undo is guaranteed, not bolted on later.
2. **Dry-run before commit, always.** Bulk operations show a per-SKU diff before
   anything happens.
3. **Fail safe, never fail wrong.** If a field can't be confidently resolved, stop
   and report it rather than writing a wrong value into a live catalogue.
4. **Account safety.** Human-paced execution with randomised delays, per-domain
   concurrency caps, backoff on 429s, and hard daily caps. CAPTCHAs pause and hand
   control back to the seller.
5. **We never handle marketplace passwords.** The extension works inside the seller's
   existing authenticated session; OAuth tokens stay server-side and encrypted.
6. **`compile()` and `validate()` are pure functions** — no network, no DOM — so the
   hardest business logic is unit-testable in milliseconds.
7. **Commission and tax rules are versioned data with effective dates**, never
   hardcoded constants.

## Testing

```bash
pnpm test         # all package + app test suites
pnpm typecheck    # workspace-wide type checking
```

The pure `rules-engine` (margin/breakeven/dry-run) and the shared schemas are covered
by fast unit tests that need no database or browser.
