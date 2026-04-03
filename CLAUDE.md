# CLAUDE.md

This file provides guidance to Claude Code when working in this project.

## Project Overview

**Bank of Somaliland (BoS) — National FX USSD Platform**

A frontend prototype for Somaliland's national foreign exchange management system. The platform enables the Central Bank to conduct Open Market Operations (OMO) and monitor all FX transactions flowing through USSD-based mobile money platforms (Zaad/Telesom and e-Dahab/Somtel).

Two portals:
- **Central Bank Portal** (`/centralbank-portal`) — OMO session management, dealer oversight, USSD transaction monitoring, AML alerts, rate controls, telco/wallet analytics, audit logs, reports
- **Dealer Portal** (`/dealer-portal`) — OMO bid submission, rate management, transaction history, allocation results, notifications

This is a **UI prototype only** — all data is mocked, no backend, no real authentication.

## Tech Stack

- **Language:** TypeScript
- **Framework:** React 18 (functional components + hooks)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom colors: `bos-blue`, `bos-navy`, `bos-green` defined in `tailwind.config.js`)
- **Routing:** React Router v6 (`BrowserRouter`, nested routes per portal)
- **Charts:** Recharts (`BarChart`, `LineChart`, `PieChart`, `AreaChart` with `ResponsiveContainer`)
- **Icons:** Lucide React
- **Auth simulation:** `localStorage` flags (`cb_logged_in`, `cb_role`, `dealer_logged_in`)

## Project Structure

```
src/
├── types/index.ts              # All TypeScript interfaces and types
├── data/mockData.ts            # All mock data (single source of truth)
├── components/ui/              # Shared UI components
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
│   │       ├── CBDashboard.tsx
│   │       ├── OMOSessions.tsx
│   │       ├── OMOSessionDetail.tsx
│   │       ├── DealerManagement.tsx
│   │       ├── USSDTransactions.tsx
│   │       ├── AMLAlerts.tsx
│   │       ├── RateControls.tsx
│   │       ├── Reports.tsx
│   │       ├── AuditLogs.tsx
│   │       └── SystemSettings.tsx
│   └── dealer/
│       ├── DealerPortal.tsx        # Dealer router + auth guard
│       ├── layout/
│       │   ├── DealerHeader.tsx
│       │   └── DealerSidebar.tsx
│       └── pages/
│           ├── DealerLogin.tsx
│           ├── DealerDashboard.tsx
│           ├── DealerOMOSessions.tsx
│           ├── AllocationResults.tsx
│           ├── DealerMyRates.tsx
│           ├── DealerTransactions.tsx
│           ├── DealerNotifications.tsx
│           └── DealerProfile.tsx
├── App.tsx                     # Root router (CB + Dealer + Landing)
├── LandingPage.tsx
└── main.tsx
```

## Development Setup

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

**Login credentials (mock):**
- Central Bank: any username + password `admin123` (role auto-assigned based on username)
- Dealer: any username + password `dealer123`

## Common Commands

- `npm run dev` — start dev server (Vite HMR)
- `npm run build` — production build
- `npx tsc --noEmit` — type-check without building
- `npx vite build` — full build with bundle output

## Domain Knowledge

### Currency
- **USD/SLS rate:** ~570 Somaliland Shillings per USD
- Dealer buy rates: ~563–567 SLS/USD
- Dealer sell rates: ~568–573 SLS/USD
- CB allowed range: buy floor 558, buy ceiling 575, sell floor 560, sell ceiling 580
- OMO fixed rates: 558–572 SLS/USD
- Market reference: SL 570

### Telcos & Wallets
| Telco | Wallet | Mobile Prefix | Wallet Prefix |
|-------|--------|---------------|---------------|
| Telesom | Zaad | 063-xxx-xxxx | — |
| Somtel | e-Dahab | 068-xxx-xxxx | 770-xxx-xxxx |

### Dealers
- Mock dealers: D001–D005, identified by `id` in `mockData.ts`
- **D002 = Premier Exchange Co.** — this is the logged-in dealer in the Dealer Portal
- Dealer tiers: Tier 1 / Tier 2

### OMO Sessions
- Types: Injection (CB injects USD into market) / Absorption (CB absorbs USD)
- Status: Active / Closed / Scheduled
- Dealers submit bids; CB allocates pro-rata or fixed

## Code Conventions

- All mock data lives in `src/data/mockData.ts` — never hardcode data inside components
- All TypeScript types/interfaces live in `src/types/index.ts`
- Shared UI components go in `src/components/ui/`
- Use Tailwind utility classes only — no custom CSS files except `src/index.css` for base styles
- Functional components with explicit `React.FC` typing
- No backend calls — all state is local React state or derived from `mockData.ts`
- `localStorage` is used only for login state, not for data persistence

## Testing

No automated tests. Verify with:
```bash
npx tsc --noEmit   # zero errors expected
npx vite build     # clean build expected
```

## Notes for Claude

- This is a **prototype/demo** — prioritize visual fidelity and realistic mock data over production robustness
- Do not add backend integration, API calls, or real auth — keep everything mock
- The USD/SLS rate is ~570 (NOT ~10,000 — that was a previous incorrect value, do not revert)
- When adding new pages to a portal, always: (1) add the route in `CentralBankPortal.tsx` or `DealerPortal.tsx`, (2) add the nav item in `CBSidebar.tsx` or `DealerSidebar.tsx`, (3) add mock data to `mockData.ts` if needed
- GitHub remote: `https://github.com/MayuRama/BoS-Project.git`
