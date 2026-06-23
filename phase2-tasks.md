# Phase 2 Tasks List

## Shared Types
- [x] Add SQS message types to `packages/shared-types/src/sqs.types.ts`
- [x] Add export to `packages/shared-types/src/index.ts`

## Order Service
- [x] Install @aws-sdk/client-sqs dependency
- [x] Create SqsProducerService
- [x] Add SQS configuration to order.module.ts
- [x] Update order.service.ts to publish message after transaction commit
- [x] Add error handling
- [x] Update order.service.spec.ts with mock SqsProducerService
- [x] Create unit tests for SqsProducerService

## Payment Service
- [x] Create SqsConsumerService
- [x] Implement message handling in AppService
- [x] Create PaymentGatewayService
- [x] Add error handling with retries
- [x] Update app.module.ts
- [x] Create unit tests

## Verification
- [x] Run all tests
- [x] Run lint
- [x] Run build
- [ ] Manual end-to-end test
