# Bank of Somaliland — National FX USSD Platform

A frontend prototype for Somaliland's national foreign exchange management system. The platform enables the Central Bank to conduct Open Market Operations (OMO) and monitor all FX transactions flowing through USSD-based mobile money platforms (Zaad/Telesom and e-Dahab/Somtel).

---

## Portals

### Central Bank Portal (`/centralbank-portal`)
- OMO session creation and management
- Dealer oversight and management
- USSD transaction monitoring (filter by telco, wallet, type, status)
- AML alerts linked to transactions
- Rate controls (buy/sell floor & ceiling)
- Telco & wallet analytics
- Audit logs and system settings

### Dealer Portal (`/dealer-portal`)
- OMO bid submission and participation
- Allocation results
- Live rate management (buy/sell)
- Transaction history
- Notifications and profile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |

---

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Mock Login Credentials

| Portal | Username | Password |
|--------|----------|----------|
| Central Bank | any | `admin123` |
| Dealer | any | `dealer123` |

---

## Domain Reference

- **USD/SLS rate:** ~570 Somaliland Shillings per USD
- **Dealer buy rates:** 563–567 SLS/USD
- **Dealer sell rates:** 568–573 SLS/USD
- **CB rate limits:** Buy floor 558 / ceiling 575, Sell floor 560 / ceiling 580

### Telcos & Wallets

| Telco | Wallet | Mobile Prefix |
|-------|--------|---------------|
| Telesom | Zaad | 063-xxx-xxxx |
| Somtel | e-Dahab | 068-xxx-xxxx |

---

## Project Structure

```
src/
├── types/index.ts              # All TypeScript interfaces
├── data/mockData.ts            # All mock data (single source of truth)
├── components/ui/              # Shared UI components
├── portals/
│   ├── centralbank/            # Central Bank portal
│   └── dealer/                 # Dealer portal
├── App.tsx                     # Root router
└── LandingPage.tsx
```

---

## Build & Type Check

```bash
npx tsc --noEmit   # Type check (zero errors expected)
npm run build      # Production build
```

---

## Deployment (Google Cloud Run)

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
gcloud run deploy bos-fx-platform \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

> **Note:** This is a UI prototype only — all data is mocked, no backend, no real authentication.
