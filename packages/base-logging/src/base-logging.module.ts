import { Global, Module } from '@nestjs/common';
import { BaseLoggingService } from './base-logging.service';
import { IBaseLoggingConfigSymbol, IBaseLoggingServiceSymbol } from './tokens';
import { IBaseLoggingConfig } from './interfaces';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables early
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Global NestJS module providing Sentry-based error tracking.
 *
 * @remarks
 * Marked as @Global() so the logging service is available everywhere
 * without re-importing the module in each feature module.
 */
@Global()
@Module({
  providers: [
    {
      provide: IBaseLoggingConfigSymbol,
      useFactory: (): IBaseLoggingConfig => ({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE,
        tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : undefined,
        profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) : undefined,
        debug: process.env.SENTRY_DEBUG === 'true',
        enablePerformanceMonitoring: process.env.SENTRY_ENABLE_PERFORMANCE_MONITORING === 'true',
        enableTracing: process.env.SENTRY_ENABLE_TRACING === 'true',
      }),
    },
    {
      provide: IBaseLoggingServiceSymbol,
      useClass: BaseLoggingService,
    },
    BaseLoggingService,
  ],
  exports: [IBaseLoggingServiceSymbol, BaseLoggingService],
})
export class BaseLoggingModule {}
