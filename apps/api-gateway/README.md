# API Gateway

**Port:** 3001

## Purpose

Single entry point for all client requests. Handles Clerk authentication, routes requests to downstream services (order-service, payment-service), and enforces access control. The frontend never calls downstream services directly.

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

- Authenticate requests via Clerk
- Proxy `/orders/**` to order-service (port 3002)
- Proxy `/payments/**` to payment-service (port 3003)
- Return 401 for unauthenticated requests
