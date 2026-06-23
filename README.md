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
│
├── migrations/
│   └── 001_init.sql                # PostgreSQL schema + seed data
│
├── docker-compose.yml
└── README.md
```

### Overall Architecture

![Seat Booking Overall Architecture](seat_booking_overall_architecture_v2.svg)

### Order & Payment Queue Flow

![Order Payment Queue Flow](order_payment_queue_flow.svg)

## Services

| Service | Port | Purpose |
|---|---|---|
| **web** | 3000 | React SPA for seat selection, auth via Clerk, order creation |
| **api-gateway** | 3001 | Entry point, Clerk auth guard, proxy to downstream services |
| **order-service** | 3002 | Seat reservations, order creation, SQS event publishing |
| **payment-service** | 3003 | Consume SQS, orchestrate payments, handle webhooks |
| **mock-payment-gateway** | 3004 | Simulate async payment provider for testing |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** (`:5432`) — transactional data (seats, orders, webhook_logs, payments)
- **MongoDB** (`:27017`) — append-only audit trails
- **LocalStack SQS** (`:4566`) — FIFO message queue
- **Sentry** (`:9000`) — error tracking
- **Redis** (`:6379`) — Sentry dependency

### 3. Run SQL migrations

```bash
# Apply schema and seed data to PostgreSQL
docker compose exec -T postgres psql -U postgres -d seat_booking < migrations/001_init.sql
```

### 4. Set up Sentry

```bash
npm run setup:sentry
```

Creates the admin user, organization, project, and writes a valid `SENTRY_DSN` into each service's `.env` file.

### 5. Create SQS queue

```bash
npm run setup:queue
```

Creates the `payment-queue.fifo` queue in LocalStack (FIFO, content-based deduplication disabled).

### 6. Run all services

```bash
# All services in one terminal
npm run start:watch:all

# Or run individual services
cd apps/api-gateway && npm run start:dev
cd apps/order-service && npm run start:dev
cd apps/payment-service && npm run start:dev
cd apps/mock-payment-gateway && npm run start:dev
cd apps/web && npm run dev
```

### 7. Seed seats (optional)

```bash
node create-seats.js
```

Creates 3 sample seats (A1, A2, B1) via the order service API.

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
- **Idempotency:** idempotency key on orders & payments + webhook_logs table + SQS deduplication
- **Audit trail:** MongoDB with TTL indexes (5yr orders, 7yr payments)
- **Auth:** Clerk with 90-day session expiry

## Payment Flow

1. User selects seat → `POST /orders` (seat reserved as PENDING)
2. Order service publishes to SQS FIFO
3. Payment service consumes message → calls mock gateway
4. Mock gateway fires webhook after 1s delay
5. Webhook handler checks idempotency → updates order + seat atomically

## Idempotency Key in Order Flow

An **idempotency key** is a unique string that tags an order and its associated payment record to guarantee that the same request cannot produce duplicate data. It plays several roles across the order lifecycle:

### 1. Generation

When `POST /orders` is handled, `OrderService.createOrder()` generates a single idempotency key:

```typescript
const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

The same key is assigned to **both** the `order` row and the `payment` row inside the same `SERIALIZABLE` transaction.

### 2. Database-level deduplication

The `orders` and `payments` tables both declare:

```sql
idempotency_key VARCHAR(255) UNIQUE NOT NULL
```

This unique constraint means that if a retry or duplicate request somehow bypasses application-level checks, the database will reject the insert with a unique-violation error, preventing silent duplication.

### 3. End-to-end traceability

The idempotency key is stored on the `IOrder` and `IPayment` entities and returned to the caller, allowing:

- The **frontend** to correlate an order with its payment.
- **Logs and audit trails** to reference the same key across services.
- The **payment service** to look up a payment by its idempotency key if needed (`PaymentRepository.findByIdempotencyKey()`).

### 4. Distinct from other deduplication mechanisms

| Mechanism | Scope | What it prevents |
|---|---|---|
| **`idempotency_key`** on order & payment rows | PostgreSQL `UNIQUE` constraint | Duplicate order or payment records from retries within the same flow |
| **`webhook_logs.webhook_id`** | PostgreSQL `PRIMARY KEY` | The same webhook payload being processed more than once |
| **SQS `MessageDeduplicationId`** | SQS FIFO queue (5-min window) | The same payment message being consumed more than once from the queue |

Together, these three layers ensure that every stage of the order-to-payment pipeline is resilient to retries and duplicates.

## Infrastructure Ports

| Component | Port |
|---|---|
| web | 3000 |
| api-gateway | 3001 |
| order-service | 3002 |
| payment-service | 3003 |
| mock-payment-gateway | 3004 |
| PostgreSQL | 5432 |
| MongoDB | 27017 |
| LocalStack SQS | 4566 |
| Redis | 6379 |
| Sentry | 9000 |
