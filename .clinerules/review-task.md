# Review Task Rules

These rules apply when reviewing code changes in this project. They are derived from `AGENT_INSTRUCTIONS.md`.

## Architecture Review

### Monorepo Structure
- Verify the monorepo follows the expected structure:
  ```
  seat-booking/
  ├── apps/
  │   ├── web/                        # React 18 + Vite (SPA)
  │   ├── api-gateway/                # NestJS — routing + Clerk auth guard
  │   ├── order-service/              # NestJS — seat reservation
  │   ├── payment-service/            # NestJS — queue consumer + webhook
  │   └── mock-payment-gateway/       # NestJS — simulate payment + fire webhook
  │
  ├── packages/
  │   ├── shared-types/               # Shared interfaces & enums (plain TS)
  │   ├── shared-errors/              # AppError base classes
  │   └── database/                   # TypeORM (PostgreSQL + MongoDB audit)
  │
  ├── docker-compose.yml
  └── README.md
  ```
- Each app and package must have its own `package.json`
- Cross-package imports must use npm workspace protocol: `"@seat-booking/shared-types": "*"`
- Root `package.json` must declare workspaces only — no build scripts

### Service Ports
| Service | Port |
|---|---|
| web (React + Vite) | 3000 |
| api-gateway | 3001 |
| order-service | 3002 |
| payment-service | 3003 |
| mock-payment-gateway | 3004 |

## Coding Style Review Checklist

### Formatting
- [ ] Indentation uses tabs, 4-space tab width
- [ ] Single quotes in all `.ts` files
- [ ] No trailing whitespace
- [ ] Files end with a final newline

### TypeScript / ESLint
- [ ] No floating promises — every `Promise` is `await`ed or `.catch()`ed
- [ ] No unsafe operations: `no-unsafe-argument`, `no-unsafe-member-access`, `no-unsafe-assignment`, `no-unsafe-call`
- [ ] Real types used over `any`

### Imports
- [ ] Standard ES imports only
- [ ] External libs first, then internal project imports
- [ ] Named imports preferred

### Dependency Injection
- [ ] Symbol-based DI tokens used (not string tokens)
- [ ] Pattern: `Symbol('IServiceName')` → `{ provide: Symbol, useClass: Service }` → `@Inject(Symbol)`

### Class Structure
- [ ] Explicit visibility modifiers: `public`, `private`, `protected` on all members
- [ ] Constructor bodies minimal
- [ ] `super(...)` called when extending base class

### Naming Conventions
- [ ] Controllers: `XxxController`
- [ ] Modules: `XxxModule`
- [ ] DTOs: `XxxDto`
- [ ] Interfaces: `IXxxService`, `IXxxRepository` (prefix `I`)
- [ ] Requests: `XxxCreateRequest`, `XxxSearchRequest`
- [ ] Responses: `XxxResponse`

### Clean Architecture Layers
- [ ] **Presentation:** controllers + request/response DTOs
- [ ] **Application:** service implementations + interfaces
- [ ] **Domain:** enums, entities, base errors
- [ ] **Infrastructure:** repositories, DB clients

## Architecture Decisions Review

### Database Split
- [ ] PostgreSQL used for transactional data (seats, orders, webhook_logs) — ACID, row-level locking, accessed via TypeORM
- [ ] MongoDB used for append-only audit trails with TTL indexes, accessed via TypeORM entities with `@Index` decorator for TTL management
- [ ] Both databases use TypeORM DataSources for a consistent ORM interface
- [ ] Audit_orders: 5 year TTL
- [ ] Audit_payments: 7 year TTL (financial compliance)

### Concurrency & Double Booking Prevention
- [ ] SQS FIFO partitioned by accountId → no two payments for same account run in parallel
- [ ] SELECT FOR UPDATE + SERIALIZABLE isolation → DB-level safety net
- [ ] SERIALIZABLE rationale documented: queue misconfiguration caught as loud DB error, not silent data corruption

### Idempotency
- [ ] SQS MessageDeduplicationId = orderId → SQS deduplicates within 5-minute window
- [ ] webhook_logs table → permanent idempotency for webhook retries
- [ ] Order status machine (PENDING → PROCESSING → CONFIRMED/FAILED) prevents re-processing

### Payment Flow
- [ ] User selects seat → POST /orders (seat reserved as PENDING)
- [ ] Order service publishes to SQS FIFO
- [ ] Payment service consumes message → calls mock gateway
- [ ] Mock gateway fires webhook after 1s delay (simulates async payment)
- [ ] Webhook handler checks idempotency → updates order + seat atomically

### Failure Cases Handled
- [ ] Duplicate webhook → idempotency key check, silently skipped
- [ ] Payment failed → seat released back to AVAILABLE in same transaction
- [ ] Service crash mid-payment → message not ACK'd → returns to queue after 30s
- [ ] Double booking attempt → ConflictError from SELECT FOR UPDATE

## Verification
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
