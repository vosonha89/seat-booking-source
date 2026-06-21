---
name: test
description: Test writing and execution for the seat-booking monorepo (Jest, NestJS, React)
---

# test

Instructions for writing and running tests across the seat-booking monorepo.

## Usage

Use this skill when writing new tests, running the test suite, or debugging test failures in any app or package.

## Steps

1. **Framework:** Jest for all apps (NestJS services and React web). E2E tests use `supertest` for NestJS apps.

2. **Test file naming:**
   - Unit tests co-located with source: `*.spec.ts` (e.g., `seat.service.spec.ts`)
   - E2E tests in `test/` directory at app root (e.g., `app.e2e-spec.ts`)

3. **What to test per layer:**

   | Layer | What to test |
   |---|---|
   | Services | Business logic, state transitions, error handling |
   | Repositories | Query logic (mock DB) |
   | Controllers | Request validation, response formatting |
   | Guards | Auth logic, token validation |

4. **Integration test scenarios:**
   - Order flow: reserve seat → create order → publish to SQS
   - Payment flow: consume SQS → call mock gateway → handle webhook
   - Idempotency: duplicate webhook calls return silently
   - Concurrency: double booking attempt returns ConflictError

5. **E2E test scenarios:**
   - Full payment flow: seat selection → order creation → payment → webhook → confirmation
   - Auth flow: unauthenticated requests return 401

6. **Mocking external services:**
   - PostgreSQL: mock `PostgresDataSource` or use testcontainers
   - MongoDB: mock `AppDataSource` from `typeorm`
   - SQS: mock `SQSClient` with `@aws-sdk/client-sqs`
   - Clerk: mock `clerkClient.verifyToken`
   - Axios: mock `axios.post` for webhook calls

7. **NestJS test pattern (example):**
   ```typescript
   import { Test, TestingModule } from '@nestjs/testing';
   import { SeatService } from './seat.service';
   import { ISeatRepositorySymbol } from './tokens';

   describe('SeatService', () => {
   	let service: SeatService;
   	let mockRepo: jest.Mocked<ISeatRepository>;

   	beforeEach(async () => {
   		mockRepo = {
   			findAll: jest.fn(),
   			reserveSeat: jest.fn(),
   		};

   		const module: TestingModule = await Test.createTestingModule({
   			providers: [
   				SeatService,
   				{ provide: ISeatRepositorySymbol, useValue: mockRepo },
   			],
   		}).compile();

   		service = module.get<SeatService>(SeatService);
   	});

   	it('should return all seats', async () => {
   		mockRepo.findAll.mockResolvedValue([]);
   		await expect(service.findAll()).resolves.toEqual([]);
   	});
   });
   ```

8. **Coverage requirements:**
   - Line coverage: ≥ 80%
   - Branch coverage: ≥ 70%
   - Critical paths (reservation, payment, idempotency): ≥ 90%

9. **Verification:**
   ```bash
   npm test       # must pass
   npm run lint   # must pass
