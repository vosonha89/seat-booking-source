# @seat-booking/base-logging

Shared Sentry-based error tracking and logging module for the seat-booking monorepo.

## Features

- Centralized Sentry initialization across all services
- Global NestJS module with DI-based configuration
- Error and message capture with context
- User context management
- Breadcrumb support for debugging
- Performance transaction tracking
- Automatic flush on application shutdown

## Installation

```bash
npm install @seat-booking/base-logging
```

## Docker Setup

To run Sentry locally with Docker:

```bash
docker-compose up -d sentry redis postgres
```

This starts:
- Sentry on http://localhost:9000
- Redis on http://localhost:6379 (required by Sentry for rate limiting and event buffering)
- PostgreSQL on http://localhost:5432

Then set the environment variables in your `.env` file:

```env
SENTRY_DSN=http://localhost:9000/1
NODE_ENV=development
```

## Usage

### NestJS Applications

Import the `BaseLoggingModule` in your root application module:

```typescript
import { Module } from '@nestjs/common';
import { BaseLoggingModule } from '@seat-booking/base-logging';

@Module({
  imports: [BaseLoggingModule],
})
export class AppModule {}
```

### Environment Variables

Configure Sentry using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry DSN for error reporting | `''` (disabled) |
| `NODE_ENV` | Application environment | `'development'` |
| `SENTRY_RELEASE` | Release version for tracking | `undefined` |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance tracing sample rate | `0.1` |
| `SENTRY_PROFILES_SAMPLE_RATE` | Profiling sample rate | `0.1` |
| `SENTRY_DEBUG` | Enable Sentry debug logging | `false` |
| `SENTRY_ENABLE_PERFORMANCE_MONITORING` | Enable performance monitoring | `false` |
| `SENTRY_ENABLE_TRACING` | Enable distributed tracing | `false` |

### Injecting the Service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IBaseLoggingServiceSymbol, IBaseLoggingService } from '@seat-booking/base-logging';

@Injectable()
export class MyService {
  constructor(
    @Inject(IBaseLoggingServiceSymbol) private readonly logger: IBaseLoggingService,
  ) {}

  doSomething(): void {
    try {
      // business logic
    } catch (error) {
      this.logger.captureException(error as Error, { context: 'additional data' });
    }
  }
}
```

## API

### IBaseLoggingService

- `captureException(error, context?)` - Capture and report an error
- `captureMessage(message, level?, context?)` - Capture a log message
- `setUser(userId, email?, username?)` - Associate events with a user
- `clearUser()` - Clear user context
- `addBreadcrumb(message, category?, level?)` - Add debugging breadcrumb
- `startTransaction(name, op?)` - Start a performance transaction
- `flush(timeout?)` - Flush pending events to Sentry

## License

UNLICENSED
