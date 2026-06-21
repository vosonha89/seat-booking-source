---
name: backend
description: NestJS backend service development for the seat-booking monorepo
---

# backend

Instructions for implementing or modifying NestJS backend services in the seat-booking monorepo.

## Usage

Use this skill when creating or modifying NestJS apps (api-gateway, order-service, payment-service, mock-payment-gateway) or shared packages (shared-types, shared-errors, database).

## Steps

1. **Identify the target service** — api-gateway, order-service, payment-service, or mock-payment-gateway. Each has its own `package.json` and runs independently.

2. **Follow Clean Architecture layers:**
   - **Presentation:** controllers + request/response DTOs
   - **Application:** service implementations + interfaces
   - **Domain:** enums, entities, base errors
   - **Infrastructure:** repositories, DB clients

3. **Use symbol-based DI tokens** — never string tokens:
   ```typescript
   // tokens.ts
   export const IMyServiceSymbol = Symbol('IMyService');

   // module
   { provide: IMyServiceSymbol, useClass: MyService }

   // consumer
   constructor(@Inject(IMyServiceSymbol) private readonly myService: IMyService) {}
   ```

4. **Naming conventions:**
   - Controllers: `XxxController`
   - Modules: `XxxModule`
   - DTOs: `XxxDto`
   - Interfaces: `IXxxService`, `IXxxRepository` (prefix `I`)
   - Requests: `XxxCreateRequest`, `XxxSearchRequest`
   - Responses: `XxxResponse`

5. **Coding style:**
   - Tabs for indentation, 4-space tab width
   - Single quotes in all `.ts` files
   - Explicit visibility modifiers: `public`, `private`, `protected`
   - Minimal constructor bodies
   - `super(...)` when extending base class
   - No floating promises — always `await` or `.catch()`
   - Prefer real types over `any`

6. **Imports order:** external libs first, then internal project imports. Use npm workspace protocol for cross-package imports: `"@seat-booking/shared-types": "*"`.

7. **Database access (TypeORM for both databases):**
   - PostgreSQL: use `PostgresDataSource` from `@seat-booking/database` for transactional data (entities: `Seat`, `Order`, `WebhookLog`)
   - MongoDB: use `AppDataSource` from `@seat-booking/database` for audit trails (entities: `AuditOrder`, `AuditPayment` with `@Index` decorator for TTL)
   - Use `queryRunner` with SERIALIZABLE isolation + pessimistic write lock for seat reservation
   - Both DataSources provide a consistent TypeORM interface

8. **Verification:**
   ```bash
   npm run lint   # must pass
   npm test       # must pass
   npm run build  # must pass
