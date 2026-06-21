# Test Task Rules

These rules apply when writing or running tests in this project. They are derived from `AGENT_INSTRUCTIONS.md`.

## Test Framework
- **Jest** for NestJS services (order-service, payment-service)
- **Jest** for React components (web)
- E2E tests with `supertest` for NestJS apps

## Test Structure
- Unit tests co-located with source files: `*.spec.ts`
- E2E tests in `test/` directory at app root
- Test files follow naming: `app.controller.spec.ts`, `seat.service.spec.ts`

## What to Test

### Unit Tests
- **Services:** business logic, state transitions, error handling
- **Repositories:** query logic (mock DB)
- **Controllers:** request validation, response formatting
- **Guards:** auth logic, token validation

### Integration Tests
- **Order flow:** reserve seat → create order → publish to SQS
- **Payment flow:** consume SQS → call mock gateway → handle webhook
- **Idempotency:** duplicate webhook calls return silently
- **Concurrency:** double booking attempt returns ConflictError

### E2E Tests
- Full payment flow: seat selection → order creation → payment → webhook → confirmation
- Auth flow: unauthenticated requests return 401

## Test Patterns

### NestJS Testing
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

### Mocking External Services
- **PostgreSQL:** mock `PostgresDataSource` or use testcontainers
- **MongoDB:** mock `AppDataSource` from `typeorm`
- **SQS:** mock `SQSClient` with `@aws-sdk/client-sqs`
- **Clerk:** mock `clerkClient.verifyToken`
- **Axios:** mock `axios.post` for webhook calls

## Coverage Requirements
- Line coverage: ≥ 80%
- Branch coverage: ≥ 70%
- Critical paths (reservation, payment, idempotency): ≥ 90%

## Verification
```bash
npm test       # must pass
npm run lint   # must pass
