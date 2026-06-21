# Seat Booking System

A monorepo of five independently deployable services for a seat booking platform with payment processing, backed by PostgreSQL, MongoDB, and SQS FIFO.

## Architecture

```
seat-booking/
├── apps/
│   ├── web/                        # React 18 + Vite (SPA) — port 3000
│   ├── api-gateway/                # NestJS — routing + Clerk auth — port 3001
│   ├── order-service/              # NestJS — seat reservation — port 3002
│   ├── payment-service/            # NestJS — queue consumer + webhook — port 3003
│   └── mock-payment-gateway/       # NestJS — simulate payment + fire webhook — port 3004
│
├── packages/
│   ├── shared-types/               # Shared interfaces & enums
│   ├── shared-errors/              # AppError base classes
│   └── database/                   # TypeORM (PostgreSQL + MongoDB audit)
```

## Services

| Service | Port | Purpose |
|---|---|---|
| **web** | 3000 | React SPA for seat selection, auth via Clerk, order creation |
| **api-gateway** | 3001 | Entry point, Clerk auth guard, proxy to downstream services |
| **order-service** | 3002 | Seat reservations, order creation, SQS event publishing |
| **payment-service** | 3003 | Consume SQS, orchestrate payments, handle webhooks |
| **mock-payment-gateway** | 3004 | Simulate async payment provider for testing |

## Quick Start

```bash
# Install all dependencies
npm install

# Start infrastructure (Postgres, MongoDB, LocalStack SQS)
docker compose up -d

# Run all services in development (from repo root)
npm run start:dev

# Or run individual services
cd apps/api-gateway && npm run start:dev
cd apps/order-service && npm run start:dev
cd apps/payment-service && npm run start:dev
cd apps/mock-payment-gateway && npm run start:dev
cd apps/web && npm run dev
```

## Run Tests

```bash
# Run all tests
npm test

# Run lint
npm run lint

# Run build
npm run build
```

## Key Features

- **Double booking prevention:** SERIALIZABLE isolation + SELECT FOR UPDATE
- **Ordered payment processing:** SQS FIFO partitioned by accountId
- **Idempotency:** webhook_logs table + SQS deduplication
- **Audit trail:** MongoDB with TTL indexes (5yr orders, 7yr payments)
- **Auth:** Clerk with 90-day session expiry

## Payment Flow

1. User selects seat → `POST /orders` (seat reserved as PENDING)
2. Order service publishes to SQS FIFO
3. Payment service consumes message → calls mock gateway
4. Mock gateway fires webhook after 1s delay
5. Webhook handler checks idempotency → updates order + seat atomically
