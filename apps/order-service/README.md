# Order Service

**Port:** 3002

## Purpose

Manages seat reservations and orders. Handles seat availability checks, order creation with SERIALIZABLE transactions to prevent double booking, and publishes payment events to SQS FIFO.

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

- List available seats
- Reserve seats (PENDING status) with `SELECT FOR UPDATE`
- Create orders linked to authenticated users
- Publish payment events to SQS FIFO (partitioned by accountId)
- Enforce SERIALIZABLE isolation for double booking prevention
