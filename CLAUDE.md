# CLAUDE.md

This file provides guidance to Claude Code when working in this project.

## Project Overview

**Bank of Somaliland (BoS) — National FX USSD Platform**

A full-stack platform for Somaliland's national foreign exchange management system. The platform enables the Central Bank to conduct Open Market Operations (OMO) and monitor all FX transactions flowing through USSD-based mobile money platforms (Zaad/Telesom and e-Dahab/Somtel).

Two portals:
- **Central Bank Portal** (`/centralbank-portal`) — OMO session management, dealer oversight, USSD transaction monitoring, AML alerts, rate controls, telco/wallet analytics, audit logs, reports
- **Dealer Portal** (`/dealer-portal`) — OMO bid submission, rate management, transaction history, allocation results, wallet balances, notifications

The project has a React frontend and a Node.js/Express backend with PostgreSQL. All major pages are fully connected to the live backend API; a small number of pages still use mockData (see below).

## Tech Stack

### Frontend
- **Language:** TypeScript
- **Framework:** React 18 (functional components + hooks)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom colors: `bos-blue`, `bos-navy`, `bos-green` defined in `tailwind.config.js`)
- **Routing:** React Router v6 (`BrowserRouter`, nested routes per portal)
- **Charts:** Recharts (`BarChart`, `LineChart`, `PieChart`, `AreaChart` with `ResponsiveContainer`)
- **Icons:** Lucide React
- **Auth:** `localStorage` flags (`cb_logged_in`, `cb_role`, `dealer_logged_in`); API auth uses cached service account JWTs (`cb_api_token`, `dealer_api_token`)

### Backend
- **Runtime:** Node.js + Express + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Real-time:** Socket.io (transaction and AML alert events)
- **Auth:** JWT (Bearer tokens); roles: `CBSuperAdmin`, `FXInterventionDesk`, `Supervisor`, `Auditor`, `DealerAdmin`, `DealerOperator`
- **Location:** `backend/` directory
- **URL:** `http://localhost:3001`
- **API prefix:** `/api`

## Project Structure

```
src/                                # Frontend
├── api/client.ts                   # API client (fetch-based, auto-attaches JWT)
├── types/index.ts                  # TypeScript interfaces for mock-data types only
├── data/mockData.ts                # Mock data for pages not yet on backend (do NOT remove)
├── components/ui/                  # Shared UI components
│   ├── KPICard.tsx
│   ├── Modal.tsx
│   └── StatusBadge.tsx
├── portals/
│   ├── centralbank/
│   │   ├── CentralBankPortal.tsx   # CB router + auth guard
│   │   ├── layout/
│   │   │   ├── CBHeader.tsx
│   │   │   └── CBSidebar.tsx
│   │   └── pages/
│   │       ├── CBLogin.tsx
│   │       ├── CBDashboard.tsx         # API-connected
│   │       ├── OMOSessions.tsx         # API-connected
│   │       ├── OMOSessionDetail.tsx    # API-connected
│   │       ├── DealerManagement.tsx
│   │       ├── USSDTransactions.tsx    # API-connected
│   │       ├── AMLAlerts.tsx           # API-connected
│   │       ├── RateControls.tsx        # API-connected
│   │       ├── SystemSettings.tsx      # API-connected
│   │       ├── Reports.tsx
│   │       ├── AuditLogs.tsx
│   └── dealer/
│       ├── DealerPortal.tsx        # Dealer router + auth guard
│       ├── layout/
│       │   ├── DealerHeader.tsx
│       │   └── DealerSidebar.tsx
│       └── pages/
│           ├── DealerLogin.tsx
│           ├── DealerDashboard.tsx     # API-connected
│           ├── DealerOMOSessions.tsx   # API-connected
│           ├── AllocationResults.tsx   # API-connected
│           ├── DealerMyRates.tsx       # API-connected
│           ├── DealerTransactions.tsx  # API-connected
│           ├── DealerNotifications.tsx
│           └── DealerProfile.tsx
├── App.tsx                         # Root router (CB + Dealer + Landing)
├── LandingPage.tsx
└── main.tsx

backend/
├── src/
│   ├── config/database.ts          # Prisma client singleton
│   ├── middleware/auth.ts           # verifyJWT, optionalJWT, requireCB, requireDealer
│   ├── modules/
│   │   ├── auth/auth.router.ts
│   │   ├── dealers/dealers.router.ts
│   │   ├── transactions/transactions.router.ts
│   │   ├── ussd/ussd.router.ts
│   │   ├── omo/omo.router.ts
│   │   ├── aml/aml.router.ts
│   │   ├── rates/rates.router.ts
│   │   ├── audit/audit.router.ts
│   │   ├── notifications/notifications.router.ts
│   │   ├── settings/settings.router.ts
│   │   └── dashboard/dashboard.router.ts
│   ├── socket/socket.ts            # Socket.io event emitters
│   └── utils/
│       ├── helpers.ts              # generateRefNumber, generateAlertCode, paginate
│       └── amlRules.ts             # AML rules engine (accepts dynamic thresholds)
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Development Setup

### Frontend
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`

### Backend
```bash
cd backend
npm install
npm run dev
```
Runs at `http://localhost:3001`

Both must be running for API-connected pages to work.

### Reseed the database
```bash
cd backend && npx prisma db seed
```

### After schema changes
```bash
cd backend && npx prisma migrate dev --name <migration_name>
# Then restart the backend (to regenerate Prisma client — DLL may be locked while running)
```

## Authentication

### UI Login (visual only)
- Central Bank: any username + password `admin123` (role auto-assigned based on username)
- Dealer: any username + password `dealer123`
- Uses `window.location.replace()` for all login/logout redirects (forces full page reload)

### API Auth (service accounts, automatic)
The API client (`src/api/client.ts`) auto-authenticates with service accounts on first request and caches the JWT:
- CB portal → `fxdesk` / `admin123` → token stored as `cb_api_token` in localStorage
- Dealer portal → `D002_admin` / `dealer123` → token stored as `dealer_api_token` in localStorage

Pages using the API do NOT need to handle auth manually — the client handles it.

## API Patterns

### Middleware rules
- `optionalJWT` — public access; if an authenticated dealer sends a JWT, response is **automatically scoped to their dealerId**
- `verifyJWT` — requires valid token, blocks unauthenticated requests
- `verifyJWT, requireCB` — CB staff only (CBSuperAdmin, FXInterventionDesk, Supervisor, Auditor)
- `verifyJWT, requireDealer` — dealer users only (DealerAdmin, DealerOperator)
- **Do NOT use `router.use(verifyJWT, requireCB)` globally** on routers that serve multiple roles — apply middleware per-route

### API client methods (src/api/client.ts)
```typescript
api.get<T>(path)          // GET
api.post<T>(path, body)   // POST
api.put<T>(path, body)    // PUT
api.patch<T>(path, body?) // PATCH (body optional)
api.delete<T>(path)       // DELETE
```
All return `T` directly — **NOT** `{ data: T }`. Never write `res.data.xxx` — just `res.xxx`.

### Prisma Decimal fields — CRITICAL
Prisma returns `Decimal` fields as **strings** from the API (e.g. `fixedRate`, `totalAmount`, `bidAmount`, `amountUSD`, `amountSL`, `rate`, `zaadBalanceUSD`). ALWAYS wrap with `Number()` before arithmetic or display:
```typescript
amountUSD: Number(t.amountUSD),   // ✅
amountUSD: t.amountUSD,           // ❌ causes string concatenation bugs
```

### Polling pattern (frontend)
```typescript
const fetchData = useCallback(async () => { ... }, [deps]);
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 15000);
  return () => clearInterval(interval);
}, [fetchData]);
```

### Paginated responses
`paginate(items, total, page, limit)` returns `{ data: T[], total, page, limit, totalPages }`.
When calling paginated endpoints, extract the array: `const list = Array.isArray(res) ? res : res.data`.

## Domain Knowledge

### Currency
- **USD/SLS rate:** ~570 Somaliland Shillings per USD (do NOT change to ~10,000)
- Dealer buy rates: ~563–567 SLS/USD
- Dealer sell rates: ~568–573 SLS/USD
- CB allowed range: buy floor 558, buy ceiling 575, sell floor 560, sell ceiling 580
- OMO fixed/baseline rates: 558–572 SLS/USD
- Market reference: SL 570

### Telcos & Wallets
| Telco | Wallet | Mobile Prefix | Wallet Prefix |
|-------|--------|---------------|---------------|
| Telesom | Zaad | 063-xxx-xxxx | — |
| Somtel | e-Dahab | 068-xxx-xxxx | 770-xxx-xxxx |

Schema enum: `walletType: 'Zaad' | 'eDahab'` (no hyphen in DB). Display as `'Zaad'` and `'e-Dahab'` (with hyphen) in the UI.

### Dealers
- Seeded dealers: D001–D005
- **D002 = Premier Exchange Co.** — the logged-in dealer in the Dealer Portal (service account `D002_admin`)
- D002 walletProvider: `Both` (Zaad: `063-7712-002`, e-Dahab: `770-3312-002`)
- Dealer tiers: `Tier1` / `Tier2`
- `dailyLimit`: D001/D002 = $500K, D003 = $450K, D004 = $400K, D005 = $250K

### Dealer Wallet Balances
Wallet balances (`zaadBalanceUSD`, `eDahabBalanceUSD`) are stored on the `Dealer` model and represent the dealer's USD balance held in each mobile money wallet system. Since real wallet integration is not available, balances are maintained in the database and updated automatically when OMO allocations are executed:
- **Injection OMO → Credit**: dealer's chosen wallet balance increases by their allocated amount
- **Absorption OMO → Debit**: dealer's chosen wallet balance decreases by their allocated amount
- All balance changes are recorded in the `WalletLedger` table
- The wallet the dealer wants credited/debited is stored as `walletChoice` on `OMOBid`

### OMO Sessions
- **Types:** `Injection` (CB pushes USD into the market → dealer wallet balances increase) / `Absorption` (CB pulls USD out of the market → dealer wallet balances decrease)
- **Status:** `Open` / `PendingAllocation` / `Completed` / `Cancelled`
- **Allocation methods:**
  - `EqualDistribution` = **Allotment** (pro-rata). If total demand ≤ supply → everyone gets exactly what they asked for. If demand > supply → each dealer gets `(bid / totalDemand) × totalSupply`.
  - `BestBidPriceWins` = **Competitive**. CB sets a **Baseline Rate**. Injection → dealers offer the highest rate (most SLS per USD) for priority. Absorption → dealers offer the lowest rate for priority. Each dealer settles at their own submitted bid rate.
- `OMOBid.submittedAt` is the bid timestamp — **not** `createdAt` (does not exist on this model)
- `OMOBid.walletChoice` stores which wallet (`Zaad` or `eDahab`) the dealer selected during bidding
- Dealers can submit **one bid per session** (unique constraint on `sessionId_dealerId`). The `upsert` pattern allows editing. Dealers can cancel (DELETE) a Submitted bid; Allocated/Partial/Rejected bids cannot be cancelled.
- `GET /api/omo-sessions/my-bids` — returns all bids for the authenticated dealer across all sessions (must be placed before `/:id` in the router)

### AML Rules Engine (`backend/src/utils/amlRules.ts`)
Accepts optional `AMLThresholds` parameter (fetched from `SystemSetting` table at runtime). Defaults:
| Rule | Condition | Priority | Triggering Txns |
|------|-----------|----------|-----------------|
| ThresholdExceeded | Single tx ≥ $50,000 (configurable) | High | 1 (the tx itself) |
| VelocityCheck | 5+ txs from same mobile in 60 min (configurable) | High | Current + all in window |
| UnusualFrequency | 3+ txs from same mobile in 60 min | Medium | Current + all in window |
| StructuringPattern | 5+ txs $8K–$10K from same wallet in 24h (count configurable) | High | Current + structuring txns |

When AML triggers: transaction → `status: 'Pending'`; contributing transactions linked via `AMLAlertTransaction` join table. Thresholds are read from `SystemSetting` table (`aml_threshold`, `velocity_limit`, `structuring_count`) and passed to `runAMLChecks()` dynamically.

### System Settings
Stored in `SystemSetting` table (key/value). Managed via `GET/PUT /api/settings`. Keys:
- `aml_threshold` — AML single transaction threshold in USD (default: 50000)
- `velocity_limit` — velocity check count per hour (default: 5)
- `structuring_count` — structuring pattern count (default: 5)
- `session_timeout` — UI session timeout in minutes
- `max_bid_tier1` / `max_bid_tier2` — OMO bid limits
- `market_ref_rate` — market reference rate
- `daily_reporting` — boolean flag

### Dashboard Endpoints
- `GET /api/dashboard/stats` — CB only (`verifyJWT, requireCB`). Returns KPIs, 7-day volume chart, transaction type split, telco split, top 5 dealers, recent 10 transactions, active sessions.
- `GET /api/dashboard/dealer-stats` — Dealer only (`verifyJWT, requireDealer`). Returns dealer info (including wallet addresses and balances), KPIs (today's volume, pending allocations, wallet balances), 7-day volume chart, recent 5 transactions, open bids, notifications. All data is scoped to `req.user.dealerId`.

### Wallet Ledger
`GET /api/dealers/wallet` — authenticated dealer only. Returns wallet provider, each wallet address + current balance, total balance, last 30 `WalletLedger` entries. Must be declared **before** `GET /api/dealers/:id` in the router.

### Status Values (API vs Display)
The API uses no-space enum values. Map before passing to `StatusBadge`:
- `'UnderReview'` → `'Under Review'`
- `'BuyUSD'` → `'Buy USD'` / `'SellUSD'` → `'Sell USD'`
- `'EqualDistribution'` → display as `'Allotment'`
- `'BestBidPriceWins'` → display as `'Best Bid Price Wins'`
- `'eDahab'` → display as `'e-Dahab'` (add hyphen for display only)

## Prisma Schema — Key Models

| Model | Key fields |
|-------|-----------|
| `Dealer` | `zaadBalanceUSD`, `eDahabBalanceUSD`, `walletProvider`, `zaadWallet`, `eDahabWallet`, `tier`, `dailyLimit`, `volume30d` |
| `OMOSession` | `type`, `status`, `fixedRate` (baseline for BestBid), `allocationMethod`, `maxBidTier1`, `maxBidTier2` |
| `OMOBid` | `bidAmount`, `bidRate` (BestBid only), `walletChoice`, `allocatedAmount`, `submittedAt` (NOT createdAt) |
| `AllocationResult` | `bidAmount`, `allocatedAmount`, `fixedRate` (dealer's settlement rate), `slSettlement`, `settlementStatus` |
| `WalletLedger` | `dealerId`, `walletType`, `entryType` (Credit/Debit), `amountUSD`, `reference`, `balanceAfter` |
| `SystemSetting` | `key` (PK), `value`, `label`, `category`, `updatedBy` |
| `Transaction` | `amountUSD`, `amountSL`, `rate` — all Decimal, wrap with `Number()` |

## Code Conventions

- **API-connected pages**: fetch from `src/api/client.ts` using `api.get/post/patch/put/delete`
- **Not-yet-connected pages**: still use `src/data/mockData.ts` — do NOT remove this file
- All TypeScript types/interfaces for API responses are defined **inline** in the component file (not in `src/types/index.ts`, which is for mock-data types only)
- Shared UI components go in `src/components/ui/`
- Use Tailwind utility classes only — no custom CSS files except `src/index.css`
- Functional components with explicit `React.FC` typing
- `localStorage` is used for login state and cached API tokens
- Backend router files: apply middleware **per-route** (`router.get('/path', verifyJWT, requireCB, handler)`), NOT globally via `router.use()` unless every route in the file requires the same middleware

## Seeded Data Summary

### Dealers
| ID | Name | Tier | Zaad Balance | e-Dahab Balance |
|----|------|------|-------------|-----------------|
| D001 | Dahabshiil Exchange | Tier1 | $250,000 | $150,000 |
| D002 | Premier Exchange Co. | Tier1 | $650,000 | $85,000 |
| D003 | Amal Bank FX | Tier1 | $480,000 | $0 (Zaad only) |
| D004 | Salaam Somali Bank FX | Tier1 | $200,000 | $50,000 |
| D005 | Gulf Remittance Co. | Tier2 | $0 (eDahab only) | $175,000 |

### OMO Sessions
| ID | Type | Status | Method | Rate |
|----|------|--------|--------|------|
| OMO-2026-001 | Injection | Completed | EqualDistribution | SL 565 |
| OMO-2026-002 | Absorption | Completed | BestBidPriceWins | SL 572 |
| OMO-2026-003 | Injection | Open | EqualDistribution | SL 558 |
| OMO-2026-004 | Absorption | PendingAllocation | EqualDistribution | SL 570 |
| OMO-2026-005 | Injection | Open | BestBidPriceWins | SL 562 |

### Transactions
- TX001–TX015: historical (March 2026)
- TX016–TX078: last 7 days (April 1–7, 2026) for dashboard charts
- D002 transactions today (Apr 7): TX069 (SellUSD $3,900 eDahab), TX073 (BuyUSD $7,800 Zaad), TX078 (BuyUSD $4,100 Zaad, Pending)

## Testing

No automated tests. Verify with:
```bash
npx tsc --noEmit          # zero errors expected (frontend)
npx vite build            # clean build expected
cd backend && npx tsc --noEmit  # zero errors expected (backend)
```

## Notes for Claude

- The USD/SLS rate is ~570 (NOT ~10,000 — that was a previous incorrect value, do not revert)
- When adding new pages to a portal: (1) add the route in `CentralBankPortal.tsx` or `DealerPortal.tsx`, (2) add the nav item in `CBSidebar.tsx` or `DealerSidebar.tsx`, (3) add mock data to `mockData.ts` if not yet API-connected
- When connecting a page to the backend, use `api` from `src/api/client.ts` — it handles auth automatically
- Always use `Number()` around Prisma Decimal fields from API responses — string concatenation bugs are silent and hard to spot
- `OMOBid.submittedAt` — not `createdAt`. The bid timestamp field is `submittedAt`
- `GET /api/omo-sessions/my-bids` must be declared BEFORE `/:id` in the router (Express matches routes in order)
- `GET /api/dealers/wallet` must be declared BEFORE `/:id` in the router
- When adding a route that mixes CB and Dealer access in the same router file, remove any global `router.use(middleware)` and apply per-route instead
- Wallet balance updates and `WalletLedger` creation happen inside the same `prisma.$transaction([...])` as the allocation result writes — they are atomic
- GitHub remote: `https://github.com/MayuRama/BoS-Project.git`
