# Household Management — Household Inventory & Expense Platform

Full-stack MERN app for Indian households. Track your kitchen and household
inventory (Aashirvaad atta, Amul milk, Tata Tea, MDH masalas...), spend in
native ₹ formatting, and get FEFO-driven expiry alerts and restock
recommendations. See `PROJECT_ARCHITECTURE.md` for the original system
design (schemas, indexes, API list, page structure, user flows, roadmap) —
the India-first UI/UX layer described below builds on top of that
foundation without changing the underlying data model.

## Structure

```
backend/     Express + Mongoose API
frontend/    React (Vite) dashboard UI
```

## Backend setup

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGODB_URI and JWT_SECRET
npm run dev                 # http://localhost:5000
```

**Sample data loads automatically.** On boot, if the database has no items,
the server fills in default categories, storage locations, suppliers, demo
users and a 48-item sample household with ~3 months of history — so every
dropdown, chart and list has data right away. It never touches existing
data. Set `AUTO_SEED=false` in `.env` to turn this off. Users can also load
it from the dashboard's welcome card or **Settings → Household data**
(`POST /api/setup/sample-data`).

To wipe everything and start from a fresh sample household instead, run
`npm run seed` (destructive — deletes all users and data first).

`npm run seed` clears and reseeds: 3 users, 10 categories, 8 storage
locations, 7 Indian suppliers (Gupta Ji Provisions / Kirana, DMart,
Reliance Smart Bazaar, BigBasket, Blinkit, Zepto, Apollo Pharmacy), 48
realistic items across genuine Indian brands (Aashirvaad, Amul, Tata
Sampann, MDH, Everest, Fortune, Britannia, Haldiram's, Surf Excel, Dettol,
Colgate...) with multi-batch, multi-expiry-tier realism, and 150+ historical
purchase/consumption transactions spanning the last ~95 days so the
dashboard's spending trend, category breakdown and consumption velocity
charts are populated immediately.

On boot the server runs an **alert scan** (expiry + low-stock + restock),
then repeats it every 24h. It's also exposed manually as
`POST /api/alerts/scan` — the frontend's Alerts page has a "Refresh Alerts"
button wired to it.

## Frontend setup

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173, proxies /api to :5000
```

Routes live under `/app/*` (`/app/dashboard`, `/app/inventory`,
`/app/purchases`, `/app/consumption`, `/app/shopping-list`, `/app/alerts`,
`/app/reports`, `/app/categories`, `/app/locations`, `/app/suppliers`,
`/app/settings`). The public root `/` serves the Household Management landing
page; old un-prefixed routes (`/dashboard`, `/inventory`, etc.) redirect to
their `/app/*` equivalents so no existing links break. `/login` and
`/register` are also public.

## Login (seeded accounts, password for all: `password123`)

- Admin: `admin@household.local` — full access (manage items, categories,
  suppliers, locations; delete records)
- Member: `raj@household.local` / `priya@household.local` — view inventory,
  add purchases, record consumption, view alerts/reports

## What's implemented

**Backend**
- All 7 collections; `batches[]` embedded in `Item`
- JWT auth, role-gated routes (ADMIN vs MEMBER)
- Item CRUD, Category/Supplier/Location CRUD
- Purchase and Consumption endpoints, both wrapped in MongoDB
  sessions/transactions
- `fefoService` — First-Expire-First-Out automatic batch selection
- `expiryService` — dynamic SAFE/EXPIRING_THIS_MONTH/EXPIRING_SOON/EXPIRED
  classification (never stored, always computed from `expiryDate`)
- `stockService` — derived current stock + low-stock check
- `restockService` — rule-based 30-day restock recommendation (no ML)
- `alertService` — idempotent scan that upserts EXPIRED / EXPIRING_SOON /
  LOW_STOCK / RESTOCK alerts, run on boot + every 24h + on demand
- Aggregation-pipeline reports: spending, most-consumed items, category
  spending, waste, expiring batches (`$match`/`$group`/`$sort`/`$lookup`/
  `$unwind`/`$project`)
- Indexes on `items.name` (text), `items.categoryId`, `items.locationId`,
  `items.batches.expiryDate`, `transactions.type`, `transactions.date`,
  `transactions.itemId`, `users.email` (unique)
- Centralized error handler (validation, cast, duplicate-key, 404 cases)
- Seed script: 3 users, 8 categories, 6 locations, 5 suppliers, 12 items
  with batches staggered across expired/expiring-soon/safe, plus derived
  purchase & consumption transaction history

**Frontend**
- Login / Register, JWT stored client-side, auto-redirect to login on 401
- Sidebar + topbar dashboard shell
- Dashboard: stat cards, category-spend pie chart, restock-recommendation
  bar chart, recent purchases/consumption
- Inventory: search, category/location/expiry-status filters, sort by
  expiry or quantity, add item (admin), delete item (admin)
- Item details: item info, batch table with per-batch expiry status,
  transaction history
- Add Purchase: existing-item or new-item form, batch/supplier fields
- Record Consumption: item + quantity only — FEFO handled entirely
  server-side, no batch picker
- Alerts: list, filter by type, mark as read, manual "Refresh Alerts" scan
- Suppliers / Categories / Settings→Locations: CRUD via a shared
  `RefDataManager` component (admin-only add/delete)
- Reports: tabbed Spending / Consumption / Category / Waste / Expiry views
  with 7-day / 30-day / this-month / last-month / custom date filters and
  charts (Recharts)

Both `npm run build` (frontend) and a full `node --check` syntax pass
(backend) succeed as of this build.

## Notable design decisions

- **Embedded batches**: batches only ever get read/written alongside their
  parent item, so they're embedded rather than a separate collection — a
  deliberate demonstration of MongoDB's document model.
- **Derived current stock**: never stored as a counter; always computed as
  the sum of `remainingQuantity` across batches, avoiding a stale/duplicated
  field.
- **MongoDB transactions**: both purchase and consumption span two writes
  (item/batch + transaction log). Both are wrapped in a session so a
  mid-operation failure rolls back cleanly rather than leaving inventory
  and the transaction ledger out of sync.
- **Idempotent alert scan**: uses `findOneAndUpdate` with `upsert: true`
  keyed on `(itemId, batchNumber, type)`, so re-running the scan refreshes
  existing alerts instead of duplicating them.

## Not included (out of scope for this build)

- Automated tests
- Production deployment config (Docker, CI/CD)
- Password reset / email verification flows
