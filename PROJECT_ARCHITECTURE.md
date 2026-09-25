# Household Inventory, Expiry & Smart Stock Management System
## System Architecture & Design Document

---

## 1. System Architecture

```
┌─────────────────────┐        REST/JSON + JWT        ┌──────────────────────┐
│   React Frontend     │ ─────────────────────────────▶ │  Express API Server  │
│  (Vite, Recharts)    │ ◀───────────────────────────── │   (Node.js)           │
└─────────────────────┘                                 └──────────┬───────────┘
                                                                     │ Mongoose ODM
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │   MongoDB Atlas       │
                                                          │  7 collections        │
                                                          └──────────────────────┘

Layers (backend):
routes/  → controllers/  → services/ (business logic) → models/ (Mongoose)
middleware/ handles auth (JWT verify), role checks, error handling, validation.
```

**Why this layering:** routes stay thin (just wiring), controllers translate HTTP ⇄ data,
and all FEFO/expiry/restock/stock math lives in `services/` so it's testable and reusable
across purchase, consumption, dashboard, and report endpoints.

---

## 2. MongoDB Collection Schemas

### 2.1 `users`
```js
{
  _id, name, email (unique, indexed), passwordHash,
  role: "ADMIN" | "MEMBER",
  createdAt, updatedAt
}
```

### 2.2 `categories`
```js
{ _id, name (unique), description, createdAt }
```

### 2.3 `suppliers`
```js
{ _id, name, contactPerson, phone, email, address, createdAt }
```

### 2.4 `locations`
```js
{ _id, name, description, createdAt }
```

### 2.5 `items` (embedded batches — core document model)
```js
{
  _id, name, brand,
  categoryId: ObjectId → categories,
  locationId: ObjectId → locations,
  unit: "kg" | "L" | "pcs" | ...,
  minimumStock: Number,
  batches: [
    {
      _id, batchNumber,
      purchaseDate, expiryDate,
      purchasedQuantity, remainingQuantity,
      pricePerUnit,
      supplierId: ObjectId → suppliers
    }
  ],
  createdAt, updatedAt
}
```
**Why embedded:** batches are always read/written together with their parent item
(FEFO consumption, stock totals, expiry scans all operate item-by-item), have no
independent identity outside the item, and stay well under MongoDB's 16MB doc limit for
a household's batch history — a textbook case for embedding over referencing.

### 2.6 `transactions` (unified purchase + consumption ledger)
```js
{
  _id, type: "PURCHASE" | "CONSUMPTION",
  itemId: ObjectId → items,
  batchNumber,
  quantity, unitPrice, totalAmount,   // purchase only
  supplierId,                          // purchase only
  userId: ObjectId → users,
  date, createdAt
}
```

### 2.7 `alerts`
```js
{
  _id, itemId, batchNumber,
  type: "EXPIRED" | "EXPIRING_SOON" | "LOW_STOCK" | "RESTOCK",
  message, severity: "LOW"|"MEDIUM"|"HIGH",
  isRead: Boolean, createdAt
}
```

### Relationships
- `items.categoryId → categories._id` (reference — categories are shared/reused)
- `items.locationId → locations._id` (reference — shared)
- `items.batches[].supplierId → suppliers._id` (reference — shared across items)
- `transactions.itemId → items._id`, `transactions.userId → users._id`
- `alerts.itemId → items._id`
- `items.batches[]` — **embedded**, not referenced

### Indexes (and why)
| Index | Reason |
|---|---|
| `items.name` (text) | Fast search-by-name on inventory page |
| `items.categoryId` | Category filter |
| `items.locationId` | Location filter |
| `items.batches.expiryDate` | Expiry scans, FEFO sort, expiry filters |
| `transactions.type` | Split purchase vs consumption queries fast |
| `transactions.date` | Date-range report filters |
| `transactions.itemId` | Item detail page transaction history |
| `users.email` (unique) | Login lookup + enforce uniqueness |

---

## 3. API List

```
Auth
POST   /api/auth/register
POST   /api/auth/login

Items
GET    /api/items                 (search, category, location, status, sort filters)
GET    /api/items/:id
POST   /api/items                 (ADMIN)
PUT    /api/items/:id             (ADMIN)
DELETE /api/items/:id             (ADMIN)

Purchases
GET    /api/purchases
POST   /api/purchases             (uses MongoDB transaction)

Consumption
GET    /api/consumption
POST   /api/consumption           (runs FEFO service, uses MongoDB transaction)

Alerts
GET    /api/alerts
PATCH  /api/alerts/:id/read

Categories / Suppliers / Locations
GET/POST/PUT/DELETE /api/categories   (ADMIN for write)
GET/POST/PUT/DELETE /api/suppliers    (ADMIN for write)
GET/POST/PUT/DELETE /api/locations    (ADMIN for write)

Dashboard
GET    /api/dashboard/summary     (stats + restock recs + recent activity)

Reports (aggregation-driven)
GET    /api/reports/summary
GET    /api/reports/spending
GET    /api/reports/consumption
GET    /api/reports/waste
GET    /api/reports/expiry
GET    /api/reports/suppliers
GET    /api/reports/categories
```

---

## 4. Frontend Page Structure

```
src/
├── components/  (Navbar, Sidebar, StatsCard, ItemCard, AlertCard, DataTable, Modal, LoadingSpinner, EmptyState)
├── pages/
│   ├── Login.jsx / Register.jsx
│   ├── Dashboard.jsx
│   ├── Inventory.jsx           → ItemDetails.jsx
│   ├── AddPurchase.jsx
│   ├── RecordConsumption.jsx
│   ├── Alerts.jsx
│   ├── Suppliers.jsx / Categories.jsx / Locations.jsx  (ADMIN)
│   ├── Reports.jsx
│   └── Settings.jsx
├── services/   (api.js — axios instance with JWT interceptor, one file per resource)
└── App.jsx     (React Router + protected/role-gated routes)
```

---

## 5. Main User Flows

**Purchase flow:** Add Purchase form → find-or-create item → push new batch →
create PURCHASE transaction → recompute low-stock/expiry status — all inside one
MongoDB session/transaction so a failure rolls everything back.

**Consumption flow (FEFO):** select item + quantity → backend fetches batches with
`remainingQuantity > 0` sorted by `expiryDate` ascending → deducts across batches
oldest-first → creates CONSUMPTION transaction(s) → rejects if total stock insufficient
→ all in one transaction.

**Expiry/alert flow:** a scheduled job (or on-demand scan) computes `daysToExpiry` per
batch → classifies SAFE/EXPIRING_THIS_MONTH/EXPIRING_SOON/EXPIRED → upserts `alerts`
for anything below SAFE and for items under `minimumStock`.

**Restock flow:** dashboard aggregates last-30-days CONSUMPTION per item → average
daily use × 30 − current stock → surfaces positive results as recommendations.

---

## 6. Development Roadmap (matches the 15-phase plan)

| Phase | Deliverable |
|---|---|
| 1 | DB design + seed script (this doc + `/backend/seed`) |
| 2 | Express + MongoDB connection (`server.js`, `config/db.js`) |
| 3 | Mongoose models (`/backend/models`) |
| 4 | JWT auth (register/login, middleware) |
| 5 | Item CRUD |
| 6 | Purchase + batch creation (transactional) |
| 7 | Consumption + FEFO service |
| 8 | Expiry engine (`expiryService`) |
| 9 | Low-stock detection (`stockService`) |
| 10 | Alerts collection + endpoints |
| 11 | Restock recommendations (`restockService`) |
| 12 | Aggregation-based reports |
| 13 | Dashboard summary endpoint + frontend charts |
| 14 | Indexes, schema validation, transaction hardening |
| 15 | Testing + UI polish |

---

*This document is the Phase-1 deliverable requested at the end of the project plan.
The scaffold below (models, config, server entry point, seed script) implements the
start of Phases 1–3 so the codebase is ready to build on.*
