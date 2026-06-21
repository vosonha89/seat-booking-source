# Mock Payment Gateway

**Port:** 3004

## Purpose

Simulates an external payment provider for development and testing. Accepts payment requests, waits 1 second, then fires an async webhook callback to the payment service with the payment result.

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

- Accept payment initiation requests from payment-service
- Simulate async payment processing (1s delay)
- Fire webhook callbacks to payment-service with success/failure result
- Support deterministic success/failure for testing scenarios
