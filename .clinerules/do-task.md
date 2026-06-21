# Do Task Rules

These rules apply when implementing or modifying code in this project. They are derived from `AGENT_INSTRUCTIONS.md`.

## Coding Style (MUST follow)

### Formatting
- **Indentation:** tabs, 4-space tab width (`.editorconfig` authoritative)
- **Quotes:** single quotes in all `.ts` files
- Trim trailing whitespace; always end files with a final newline

### ESLint / Type Safety
- No floating promises — every `Promise` must be `await`ed or `.catch()`ed
- No unsafe operations: `no-unsafe-argument`, `no-unsafe-member-access`, `no-unsafe-assignment`, `no-unsafe-call`
- Prefer real types over `any`

### Imports
- Standard ES imports only
- Order: external libs first, then internal project imports
- Prefer named imports

### Dependency Injection
- Use **symbol-based DI tokens** — not string tokens
- Pattern:
  ```typescript
  // tokens.ts
  export const IOrderServiceSymbol = Symbol('IOrderService');

  // module
  { provide: IOrderServiceSymbol, useClass: OrderService }

  // consumer
  constructor(@Inject(IOrderServiceSymbol) private readonly orderService: IOrderService) {}
  ```

### JSDoc Comments
- All public methods, classes, and interfaces must have JSDoc comments
- Describe parameters, return values, and thrown errors
- Use `@param`, `@returns`, `@throws` tags as appropriate

### Class Structure
- Explicit visibility modifiers: `public`, `private`, `protected` on all members
- Constructor bodies minimal
- `super(...)` required when extending base class

### Naming
- Controllers: `XxxController`
- Modules: `XxxModule`
- DTOs: `XxxDto`
- Interfaces: `IXxxService`, `IXxxRepository` (prefix `I`)
- Requests: `XxxCreateRequest`, `XxxSearchRequest`
- Responses: `XxxResponse`

### Clean Architecture Layers
- **Presentation:** controllers + request/response DTOs
- **Application:** service implementations + interfaces
- **Domain:** enums, entities, base errors
- **Infrastructure:** repositories, DB clients (TypeORM DataSources)

## Monorepo Structure

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

- Each app and package has its own `package.json`
- Cross-package imports use npm workspace protocol: `"@seat-booking/shared-types": "*"`
- Root `package.json` declares workspaces only — no build scripts

## Verification (MUST pass before finishing)
```bash
npm run lint   # must pass
npm test       # must pass
npm run build  # must pass
```

## Service Ports
| Service | Port |
|---|---|
| web (React + Vite) | 3000 |
| api-gateway | 3001 |
| order-service | 3002 |
| payment-service | 3003 |
| mock-payment-gateway | 3004 |

## Key Architecture Decisions
- PostgreSQL for transactional data (seats, orders, webhook_logs) — ACID, row-level locking, accessed via TypeORM
- MongoDB for append-only audit trails with TTL indexes, accessed via TypeORM entities with `@Index` decorator for TTL management
- Both databases use TypeORM DataSources for a consistent ORM interface
- SQS FIFO (LocalStack) for ordered payment processing per account
- Clerk for auth with 90-day session expiry
- SERIALIZABLE isolation + SELECT FOR UPDATE for double booking prevention
- Idempotency via webhook_logs table and SQS MessageDeduplicationId
