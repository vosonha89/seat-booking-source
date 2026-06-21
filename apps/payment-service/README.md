# Payment Service

**Port:** 3003

## Purpose

Consumes payment events from SQS FIFO, orchestrates payment processing via the mock payment gateway, and handles webhook callbacks. Updates order and seat status atomically based on payment outcomes.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run start:dev

# Run tests
npm test

# Lint
npm run lint
```

## Responsibilities

- Consume payment events from SQS FIFO (ordered per accountId)
- Call mock-payment-gateway to process payments
- Handle async webhook callbacks from the payment gateway
- Update order status (PENDING → PROCESSING → CONFIRMED/FAILED)
- Release seats back to AVAILABLE on payment failure
- Ensure idempotency via webhook_logs table
