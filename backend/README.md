# BoS FX Platform — Backend API

Node.js + Express + TypeScript + Prisma + PostgreSQL

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection string
```

### 4. Setup database
```bash
# Create the database in PostgreSQL first:
# CREATE DATABASE bos_fx;

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 5. Start the server
```bash
npm run dev
```

API runs at: `http://localhost:3001`
Health check: `http://localhost:3001/api/health`

---

## Login Credentials (from seed)

| Portal | Username | Password | Role |
|--------|----------|----------|------|
| Central Bank | `admin` | `admin123` | CBSuperAdmin |
| Central Bank | `fxdesk` | `admin123` | FXInterventionDesk |
| Central Bank | `analyst` | `admin123` | Supervisor |
| Central Bank | `auditor` | `admin123` | Auditor |
| Dealer (D002) | `dealer` | `dealer123` | DealerOperator |
| Dealer (D002) | `D002_admin` | `dealer123` | DealerAdmin |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login (CB or Dealer) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dealers` | List all dealers |
| POST | `/api/dealers` | Create dealer (CB only) |
| GET | `/api/dealers/:id` | Dealer detail |
| PUT | `/api/dealers/:id` | Update dealer |
| GET | `/api/omo-sessions` | List OMO sessions |
| POST | `/api/omo-sessions` | Create session |
| POST | `/api/omo-sessions/:id/allocate` | Run allocation |
| POST | `/api/omo-sessions/:id/bids` | Submit bid (dealer) |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/aml-alerts` | List AML alerts (CB only) |
| GET | `/api/rates/controls` | Current rate limits |
| PUT | `/api/rates/controls` | Update rate limits (CB) |
| GET | `/api/rates/history` | Rate history |
| GET | `/api/audit-logs` | Audit logs (CB only) |
| GET | `/api/notifications` | Notifications |
| POST | `/api/ussd/simulate` | USSD transaction simulator |
| GET | `/api/ussd/dealers` | Dealers for USSD simulator |

---

## Socket.io Events

Connect: `http://localhost:3001` with `{ auth: { token: accessToken } }`

| Event | Direction | Payload |
|-------|-----------|---------|
| `transaction:new` | Server → Client | `{ transaction }` |
| `aml:alert_created` | Server → CB | `{ alert }` |
| `omo:status_changed` | Server → All | `{ sessionId, status }` |
| `omo:allocated` | Server → CB + Dealers | `{ sessionId, results }` |
| `notification:new` | Server → Dealer | `{ notification }` |
| `rate:updated` | Server → All | `{ controls }` |

---

## Database Commands

```bash
npm run db:migrate    # Run pending migrations
npm run db:seed       # Seed sample data
npm run db:studio     # Open Prisma Studio (GUI)
npm run db:reset      # Reset DB and re-seed
```
