# Marketplace Adapters — Sprint Deliverable 

 

---

## 1. Executive Summary

This sprint expands Project Neo's AI-powered autofill from a **single marketplace (Meesho)** to **three Indian e-commerce platforms**: Meesho Supplier Panel, Amazon Seller Central, and Flipkart Seller Hub.

Two new workspace packages — `@neo/adapter-amazon` and `@neo/adapter-flipkart` — replicate the proven `@neo/adapter-meesho` architecture. The browser extension's content script and side-panel fill logic have been updated to **dynamically detect** the active seller platform from the tab URL and route `NEO_FILL` messages to the correct adapter, with zero impact on the existing Meesho flow.

### Scope Isolation Guarantee

All changes are strictly isolated to our assigned tasks. **No files** belonging to the following team areas were modified:

| Area | Owner | Status |
|------|-------|--------|
| Backend DB, auth, private sessions | Sreenidhi | ✅ Untouched |
| UI aesthetics, CSS, button shadows | Pranav | ✅ Untouched |
| Bulk Catalogue Manager (extension UI) | Shreyam | ✅ Untouched |
| Local Vision / Ollama / Moondream | Abdullah & Ammar | ✅ Untouched |
| Private catalogue uploads | Dilan | ✅ Untouched |
| Adaptive learning algorithms | Anilabho | ✅ Untouched |
| Test cases / QA feedback loops | Vamshi | ✅ Untouched |

---

## 2. Architecture Overview

### Before (Meesho-only)

```
Side Panel (fill.ts) ──► content.ts ──► meesho.com DOM
                             │
                     @neo/adapter-meesho
                     (selectors + compile + validate)
```

### After (Multi-marketplace)

```
                                  ┌──► meesho.com DOM
                                  │    @neo/adapter-meesho
Side Panel (fill.ts) ──► content.ts ──► sellercentral.amazon.in DOM
  (URL auto-detect)       (router) │    @neo/adapter-amazon
                                  └──► seller.flipkart.com DOM
                                       @neo/adapter-flipkart
```

### Message Flow

1. **Side panel** calls `sendFill()` which queries `chrome.tabs` for the active seller tab.
2. `fill.ts` auto-detects the marketplace from the tab URL using `MARKETPLACE_PATTERNS`:
   ```
   meesho    → /^https?:\/\/([^/]*\.)?meesho\.com\//i
   amazon_in → /^https?:\/\/([^/]*\.)?sellercentral\.amazon\.(in|com)\//i
   flipkart  → /^https?:\/\/([^/]*\.)?seller\.flipkart\.com\//i
   ```
3. A `NEO_FILL` message is dispatched via `chrome.tabs.sendMessage` with the detected `marketplace` discriminant field.
4. **`content.ts`** receives the message, reads `message.marketplace` (or falls back to `detectMarketplace()` from `window.location.hostname`), and routes to the correct fill handler:
   - `"meesho"` → `fillForm()` (legacy fixture) or `fillByName()` (live)
   - `"amazon_in"` → `fillAmazonForm()` (fixture) or `fillByName(..., "amazon_in")` (live)
   - `"flipkart"` → `fillFlipkartForm()` (fixture) or `fillByName(..., "flipkart")` (live)
5. **Backward compatibility**: If `marketplace` is absent from the message, `content.ts` defaults to Meesho — existing integrations work unchanged.

### Dependency Graph

```
@neo/genome (Zod schema: ProductGenome)
    │
    ▼
@neo/adapter (shared types: MarketplaceId, CompiledListing, ValidationIssue)
    │
    ├──► @neo/adapter-meesho   (existing — unchanged)
    ├──► @neo/adapter-amazon   (NEW)
    └──► @neo/adapter-flipkart (NEW)
         │
         ▼
    @neo/extension (content.ts + fill.ts consume all three adapters)
```

---

## 3. New Packages Created

### 3.1 `@neo/adapter-amazon`

**Location:** `packages/adapter-amazon/`  
**Package name:** `@neo/adapter-amazon`  
**Adapter ID:** `"amazon_in"` (matches `MarketplaceId` union in `@neo/adapter`)  

#### File Structure (7 source files)

```
packages/adapter-amazon/
├── package.json          # workspace:* deps on @neo/genome + @neo/adapter
├── tsconfig.json         # extends ../../tsconfig.base.json
└── src/
    ├── index.ts           # barrel export
    ├── selectors.ts       # AmazonSelectorMap interface + SELECTOR_CONFIGS
    ├── selectors.test.ts  # 2 tests
    ├── compile.ts         # ProductGenome → CompiledListing (amazon_in)
    ├── compile.test.ts    # 2 tests
    ├── validate.ts        # Amazon-specific validation rules
    └── validate.test.ts   # 8 tests
```

#### DOM Selectors (`selectors.ts`)

The `AmazonSelectorMap` interface defines **13 fields** targeting Amazon Seller Central's "Add a Product" form:

| Field | Fixture Selector | Live Selector | Notes |
|-------|-----------------|---------------|-------|
| `productName` | `#productName` | `input[name="item_name"]` | Product title |
| `description` | `#description` | `textarea[name="product_description"]` | Product description |
| `brandName` | `#brandName` | `input[name="brand_name"]` | Brand (may be autocomplete) |
| `bulletPoint1` | `#bulletPoint1` | `textarea[name="bullet_point1"]` | Key feature 1 |
| `bulletPoint2` | `#bulletPoint2` | `textarea[name="bullet_point2"]` | Key feature 2 |
| `bulletPoint3` | `#bulletPoint3` | `textarea[name="bullet_point3"]` | Key feature 3 |
| `mrp` | `#mrp` | `input[name="list_price"]` | Maximum Retail Price |
| `sellingPrice` | `#sellingPrice` | `input[name="standard_price"]` | Your selling price |
| `hsnCode` | `#hsnCode` | `input[name="hsn_code"]` | Tax classification |
| `skuId` | `#skuId` | `input[name="item_sku"]` | Seller SKU |
| `quantity` | `#quantity` | `input[name="quantity"]` | Available stock |
| `searchKeywords` | `#searchKeywords` | `textarea[name="generic_keywords"]` | Backend search terms |
| `submit` | `#submit` | `""` (empty — no stable selector) | Not auto-clicked |

**Strategy:** Amazon Seller Central is a React SPA with reasonably stable `name` attributes on form inputs, similar to Meesho's approach. The `live` config targets these `name` attributes exclusively.

#### Compile Logic (`compile.ts`)

Maps `ProductGenome` → Amazon-shaped `CompiledListing`:

| Genome Field | Amazon Field | Transform |
|-------------|-------------|-----------|
| `genome.title` | `productName` | Pass-through, default `""` |
| `attrs.description` | `description` | From `genome.attributes` |
| `genome.brand` | `brandName` | Pass-through, default `""` |
| `attrs.bulletPoints[0..2]` | `bulletPoint1..3` | Array split into separate fields |
| `attrs.keywords` | `searchKeywords` | Joined with `", "` |
| `genome.sellingPrice` | `sellingPrice` | Decimal string pass-through |
| `genome.costPrice` | `mrp` | Falls back to `sellingPrice` |
| `genome.hsnCode` | `hsnCode` | Pass-through, default `""` |

#### Validation Rules (`validate.ts`)

| Field | Rule | Severity |
|-------|------|----------|
| `productName` | Required, max **200 characters** | `error` |
| `description` | Required, max **2,000 characters** | `error` |
| `brandName` | Required | `error` |
| `bulletPoint1..3` | Max **500 characters** each | `warning` |
| `sellingPrice` | Must be a positive number (`Number()` coercion) | `error` |
| `hsnCode` | Required for Amazon IN sellers | `error` |
| `images` | Non-empty array recommended | `warning` |

---

### 3.2 `@neo/adapter-flipkart`

**Location:** `packages/adapter-flipkart/`  
**Package name:** `@neo/adapter-flipkart`  
**Adapter ID:** `"flipkart"` (matches `MarketplaceId` union in `@neo/adapter`)  

#### File Structure (7 source files)

```
packages/adapter-flipkart/
├── package.json          # workspace:* deps on @neo/genome + @neo/adapter
├── tsconfig.json         # extends ../../tsconfig.base.json
└── src/
    ├── index.ts           # barrel export
    ├── selectors.ts       # FlipkartSelectorMap interface + SELECTOR_CONFIGS
    ├── selectors.test.ts  # 2 tests
    ├── compile.ts         # ProductGenome → CompiledListing (flipkart)
    ├── compile.test.ts    # 3 tests
    ├── validate.ts        # Flipkart-specific validation (incl. SP ≤ MRP)
    └── validate.test.ts   # 10 tests
```

#### DOM Selectors (`selectors.ts`)

The `FlipkartSelectorMap` interface defines **11 fields** targeting Flipkart Seller Hub's "Add Single Listing" form:

| Field | Fixture Selector | Live Selector | Notes |
|-------|-----------------|---------------|-------|
| `productName` | `#productName` | `input[name="product_name"]` | Listing title |
| `description` | `#description` | `textarea[name="description"]` | Product description |
| `brand` | `#brand` | `input[name="brand"]` | Brand autocomplete |
| `mrp` | `#mrp` | `input[name="mrp"]` | Maximum Retail Price |
| `sellingPrice` | `#sellingPrice` | `input[name="selling_price"]` | Must be ≤ MRP |
| `hsnCode` | `#hsnCode` | `input[name="hsn"]` | Tax classification |
| `skuId` | `#skuId` | `input[name="sku_id"]` | Seller SKU / FSN |
| `procurementSla` | `#procurementSla` | `input[name="procurement_sla"]` | Days to ship (secondary section) |
| `stockCount` | `#stockCount` | `input[name="stock"]` | Available units (secondary section) |
| `shippingDays` | `#shippingDays` | `input[name="shipping_days"]` | Delivery timeline |
| `submit` | `#submit` | `""` (empty — no stable selector) | Not auto-clicked |

**Strategy:** Flipkart Seller Hub uses an Angular/React hybrid. The `live` config targets `name` attributes as the most stable selectors. Fields like `procurementSla` and `stockCount` may be in secondary accordion sections that aren't visible on initial page load — these are assigned `""` in the selector map and skipped silently.

#### Compile Logic (`compile.ts`)

Maps `ProductGenome` → Flipkart-shaped `CompiledListing`:

| Genome Field | Flipkart Field | Transform |
|-------------|---------------|-----------|
| `genome.title` | `productName` | Pass-through, default `""` |
| `attrs.description` | `description` | From `genome.attributes` |
| `genome.brand` | `brand` | Pass-through, default `""` |
| `genome.costPrice` | `mrp` | List/cost price, default `0` |
| `genome.sellingPrice` | `sellingPrice` | Default `0` |
| `genome.hsnCode` | `hsnCode` | Pass-through, default `""` |
| `attrs.procurementSla` | `procurementSla` | **Defaults to `"3"` days** if not specified |
| `attrs.shippingDays` | `shippingDays` | Defaults to `""` |
| N/A | `stockCount` | Always `""` (seller sets manually) |

#### Validation Rules (`validate.ts`)

| Field | Rule | Severity |
|-------|------|----------|
| `productName` | Required, max **140 characters** | `error` |
| `description` | Required, max **5,000 characters** | `error` |
| `brand` | Required | `error` |
| `mrp` | Must be a positive number (`Number()` coercion) | `error` |
| `sellingPrice` | Must be a positive number (`Number()` coercion) | `error` |
| `sellingPrice` | **Must be ≤ MRP** (Flipkart's mandatory business rule) | `error` |
| `hsnCode` | Required | `error` |
| `images` | Non-empty array recommended | `warning` |

> **Note on SP ≤ MRP:** Flipkart enforces that the selling price can never exceed the MRP. If `sellingPrice > mrp`, the validator emits: `"Selling price cannot exceed MRP on Flipkart."` This prevents upload failures on the platform.

---

## 4. Modified Files (`apps/extension`)

The following existing files were modified. **No other files in the monorepo were touched.**

### 4.1 `entrypoints/content.ts`

- **Imports expanded:** Now imports `SELECTOR_CONFIGS`, type interfaces, and `ConfigId` from all three adapter packages (`@neo/adapter-meesho`, `@neo/adapter-amazon`, `@neo/adapter-flipkart`) plus `MarketplaceId` from `@neo/adapter`.
- **`matches` array expanded:** Content script now injects on:
  - `*://*.meesho.com/*`
  - `*://*.sellercentral.amazon.in/*`
  - `*://*.sellercentral.amazon.com/*`
  - `*://*.seller.flipkart.com/*`
- **`FillMessage` interface extended:** Added optional `marketplace: MarketplaceId` discriminant field (backward-compatible — defaults to `"meesho"` when absent).
- **`detectMarketplace()` function added:** Reads `window.location.hostname` to auto-detect which seller platform the content script is running on.
- **Message listener router:** Routes based on resolved `marketplace`:
  - `"meesho"` → existing `fillForm()` / `fillByName()` (unchanged logic)
  - `"amazon_in"` → new `fillAmazonForm()` / `fillByName(..., "amazon_in")`
  - `"flipkart"` → new `fillFlipkartForm()` / `fillByName(..., "flipkart")`
- **New fill helpers:**
  - `fillNativeSelect()` — fills HTML `<select>` elements by matching value or visible text (Amazon uses native `<select>` for some category dropdowns).
  - `setAngularValue()` — extends `setNativeValue()` with an additional `blur` event dispatch required by Flipkart's Angular reactive form binding.
  - `fillGridRow()` — fills cells in a `[role="grid"]` table by column-index mapping, targeting editable `<input>`, `<textarea>`, or `[contenteditable]` elements within `[role="gridcell"]` (Flipkart bulk upload grid).
  - `fillAmazonForm()` — fixed-field fill for Amazon fixture selectors (13 fields in sequence).
  - `fillFlipkartForm()` — fixed-field fill for Flipkart fixture selectors (10 fields with Angular blur dispatch).
- **`fillByName()` updated:** Now accepts a `marketplace` parameter; Flipkart fields receive the extra `blur` event, and Amazon `<select>` elements are handled via `fillNativeSelect()`.

### 4.2 `entrypoints/sidepanel/fill.ts`

- **Replaced** single `TARGET_URL_PATTERN` regex with a `MARKETPLACE_PATTERNS` record mapping each `MarketplaceId` to its URL pattern.
- **Tab detection** now finds ANY tab matching a supported marketplace (not just Meesho).
- **Auto-detects** marketplace from the matched tab's URL; sets `message.marketplace` accordingly.
- **`sendFill()` signature expanded:** New optional `marketplace?: MarketplaceId` parameter for explicit override.
- **`NO_RECEIVER_HINTS`:** Per-marketplace error messages (e.g., `"Open your Amazon Seller Central Add-Product page…"`).

### 4.3 `wxt.config.ts`

- **`host_permissions` expanded** from 2 entries to 5:
  ```
  http://localhost:3000/*          (backend API — existing)
  *://*.meesho.com/*               (existing)
  *://*.sellercentral.amazon.in/*  (NEW)
  *://*.sellercentral.amazon.com/* (NEW)
  *://*.seller.flipkart.com/*      (NEW)
  ```

### 4.4 `package.json`

- **3 workspace dependencies added:**
  ```json
  "@neo/adapter": "workspace:*",
  "@neo/adapter-amazon": "workspace:*",
  "@neo/adapter-flipkart": "workspace:*"
  ```
  (`@neo/adapter` was needed as a direct dependency because `content.ts` and `fill.ts` import the `MarketplaceId` type from it.)

---

## 5. Testing & Verification

### 5.1 Test Results Summary

| Package | Test Files | Tests | Status |
|---------|-----------|-------|--------|
| `@neo/adapter-amazon` | 3 | 12 | ✅ All passing |
| `@neo/adapter-flipkart` | 3 | 15 | ✅ All passing |
| `@neo/adapter-meesho` | 3 | 14 | ✅ All passing (regression check) |
| **Total** | **9** | **41** | **✅ Zero failures** |

### 5.2 Commands to Reproduce

```bash
# Build new adapter packages (+ their dependencies @neo/genome, @neo/adapter)
pnpm turbo run build --filter=@neo/adapter-amazon --filter=@neo/adapter-flipkart

# Run all adapter tests (Amazon + Flipkart)
pnpm turbo run test --filter=@neo/adapter-amazon --filter=@neo/adapter-flipkart

# Run Meesho regression tests (ensure nothing broke)
pnpm --filter @neo/adapter-meesho test

# Run ALL workspace tests at once
pnpm turbo run test

# Typecheck the extension (verifies content.ts + fill.ts imports are correct)
pnpm --filter @neo/extension typecheck

# Full monorepo build (all packages)
pnpm turbo run build
```

### 5.3 What the Tests Cover

**Amazon adapter tests (12):**
- Selector configs define all 13 fields for both `fixture` and `live` environments
- Fixture config uses DOM `#id` selectors; live config uses `input[name="..."]` attribute selectors
- `compile()` correctly maps genome fields to Amazon field names (productName, bulletPoints, searchKeywords, etc.)
- `compile()` safely defaults missing optional fields (no throws on null/undefined)
- `validate()` catches: missing title, title > 200 chars, missing description, missing brand, non-positive price, missing HSN code, missing images

**Flipkart adapter tests (15):**
- Selector configs define all 11 fields for both `fixture` and `live` environments
- Fixture config uses DOM `#id` selectors; live config uses `input[name="..."]` attribute selectors
- `compile()` correctly maps genome fields to Flipkart field names
- `compile()` defaults `procurementSla` to `"3"` when not specified in genome
- `compile()` safely defaults missing optional fields
- `compile()` is pure (same input → same output)
- `validate()` catches: missing product name, name > 140 chars, missing description, missing brand, non-positive MRP, non-positive selling price, **selling price > MRP**, missing HSN code, missing images

---

## 6. Pending Action Items

### 🔴 Critical (Before Production)

| # | Item | Details |
|---|------|---------|
| 1 | **Amazon Seller Central test account** | The `live` selector config targets `input[name="item_name"]`, `textarea[name="product_description"]`, etc. These must be validated against the actual Amazon Seller Central DOM. If Amazon changes their form field `name` attributes between regions or updates, selectors will need adjustment. |
| 2 | **Flipkart Seller Hub test account** | Similarly, the `live` Flipkart selectors target `input[name="product_name"]`, `input[name="mrp"]`, etc. Flipkart's Angular/React hybrid may use `data-testid` attributes in some builds. The selectors need verification against the production Flipkart Seller Hub. |

### 🟡 Important (Bulk Upload Support)

| # | Item | Details |
|---|------|---------|
| 3 | **Flipkart bulk grid column mapping** | The `fillGridRow()` helper is implemented and can fill `[role="gridcell"]` elements by column index. However, column ordering may vary by product category on Flipkart. Needs real-world testing to build a reliable column-to-field mapping table. |
| 4 | **Amazon bulk upload** | Amazon uses a spreadsheet-download/upload model for bulk listings (not an in-browser grid). Our adapter can help navigate to the correct template category and pre-fill the upload page, but the actual CSV/Excel filling is outside content-script scope. |

### 🟢 Nice-to-Have (Future Sprints)

| # | Item | Details |
|---|------|---------|
| 5 | **Side-panel marketplace selector** | The side-panel UI currently assumes Meesho in its user-facing flow. Adding a marketplace dropdown (Meesho / Amazon / Flipkart) would let sellers explicitly choose their target. The backend routing works regardless — this is a UX enhancement. |
| 6 | **Category-specific attribute selectors** | Amazon and Flipkart have category-specific attribute fields (e.g., "Sleeve Length" for apparel, "Wattage" for electronics). These could be added as extended selector maps per category in future adapter versions. |

---

## 7. File Inventory

### New Files (18 total)

| # | Path | Purpose |
|---|------|---------|
| 1 | `packages/adapter-amazon/package.json` | Package manifest |
| 2 | `packages/adapter-amazon/tsconfig.json` | TypeScript config |
| 3 | `packages/adapter-amazon/src/index.ts` | Barrel export |
| 4 | `packages/adapter-amazon/src/selectors.ts` | DOM selector maps |
| 5 | `packages/adapter-amazon/src/selectors.test.ts` | Selector tests |
| 6 | `packages/adapter-amazon/src/compile.ts` | Genome → Amazon fields |
| 7 | `packages/adapter-amazon/src/compile.test.ts` | Compile tests |
| 8 | `packages/adapter-amazon/src/validate.ts` | Validation rules |
| 9 | `packages/adapter-amazon/src/validate.test.ts` | Validation tests |
| 10 | `packages/adapter-flipkart/package.json` | Package manifest |
| 11 | `packages/adapter-flipkart/tsconfig.json` | TypeScript config |
| 12 | `packages/adapter-flipkart/src/index.ts` | Barrel export |
| 13 | `packages/adapter-flipkart/src/selectors.ts` | DOM selector maps |
| 14 | `packages/adapter-flipkart/src/selectors.test.ts` | Selector tests |
| 15 | `packages/adapter-flipkart/src/compile.ts` | Genome → Flipkart fields |
| 16 | `packages/adapter-flipkart/src/compile.test.ts` | Compile tests |
| 17 | `packages/adapter-flipkart/src/validate.ts` | Validation rules |
| 18 | `packages/adapter-flipkart/src/validate.test.ts` | Validation tests |

### Modified Files (4 total)

| # | Path | Change Summary |
|---|------|---------------|
| 1 | `apps/extension/entrypoints/content.ts` | Multi-marketplace router, new fill helpers |
| 2 | `apps/extension/entrypoints/sidepanel/fill.ts` | URL auto-detect, marketplace-aware messaging |
| 3 | `apps/extension/wxt.config.ts` | Amazon + Flipkart host permissions |
| 4 | `apps/extension/package.json` | 3 new workspace dependencies |

### Auto-updated Files

| # | Path | Reason |
|---|------|--------|
| 1 | `pnpm-lock.yaml` | Auto-updated by `pnpm install` after adding new workspace packages |

---

*Document generated on 2026-09-06. Sprint deliverable for Team Lead review.*
