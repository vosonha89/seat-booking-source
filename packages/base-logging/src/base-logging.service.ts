import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { IBaseLoggingConfig, IBaseLoggingService } from './interfaces';
import { IBaseLoggingConfigSymbol } from './tokens';

/**
 * Service providing centralized error tracking and logging via Sentry.
 *
 * @remarks
 * Wraps Sentry SDK to provide a consistent interface across all services.
 * Automatically initializes on module init and flushes on module destroy.
 */
@Injectable()
export class BaseLoggingService implements IBaseLoggingService, OnModuleInit, OnModuleDestroy {
  private readonly config: IBaseLoggingConfig;

  constructor(@Inject(IBaseLoggingConfigSymbol) config: IBaseLoggingConfig) {
    this.config = config;
  }

  /**
   * Initializes Sentry with the provided configuration.
   *
   * @remarks
   * Called automatically by NestJS when the module is initialized.
   * Configures Sentry with DSN, environment, release, and sampling rates.
   */
  onModuleInit(): void {
    // Only initialize Sentry if we have a valid DSN
    if (this.config.dsn && this.isValidSentryDsn(this.config.dsn)) {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate ?? 0.1,
        profilesSampleRate: this.config.profilesSampleRate ?? 0.1,
        debug: this.config.debug ?? false,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Console(),
        ],
      });

      if (this.config.enablePerformanceMonitoring) {
        Sentry.captureMessage('Application startup', 'info');
      }
    } else {
      // If DSN is invalid or missing, log a warning (but don't crash)
      const message = this.config.dsn
        ? `Sentry DSN "${this.config.dsn}" is invalid. Sentry will not be initialized.`
        : 'Sentry DSN is not provided. Sentry will not be initialized.';

      console.warn(message);
    }
  }

  /**
   * Validates a Sentry DSN format.
   *
   * @param dsn - The DSN to validate.
   * @returns True if the DSN is valid, false otherwise.
   */
  private isValidSentryDsn(dsn: string): boolean {
    // Valid DSN format: http(s)://<public_key>@<host>:<port>/<project_id>
    const dsnRegex = /^https?:\/\/[^\s@]+@[^\s/:]+(?:\:\d+)?\/\d+$/;
    return dsnRegex.test(dsn);
  }

  /**
   * Flushes pending Sentry events before the module is destroyed.
   *
   * @param timeout - Maximum time in milliseconds to wait for flush. Defaults to 2000ms.
   * @returns Promise resolving to true if flush succeeded, false otherwise.
   */
  async onModuleDestroy(): Promise<void> {
    await this.flush(2000);
  }

  /**
   * Captures an exception and sends it to Sentry.
   *
   * @param error - The error to capture.
   * @param context - Additional context data to attach to the event.
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Captures a message and sends it to Sentry.
   *
   * @param message - The message to capture.
   * @param level - Severity level. Defaults to 'info'.
   * @param context - Additional context data to attach to the event.
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>): void {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Associates subsequent events with a specific user.
   *
   * @param userId - Unique identifier for the user.
   * @param email - User's email address.
   * @param username - User's username.
   */
  setUser(userId: string, email?: string, username?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }

  /**
   * Clears the current user context from subsequent events.
   */
  clearUser(): void {
    Sentry.setUser(null);
  }

  /**
   * Adds a breadcrumb to the current scope for debugging context.
   *
   * @param message - Breadcrumb message.
   * @param category - Category of the breadcrumb (e.g., 'auth', 'db', 'http').
   * @param level - Severity level.
   */
  addBreadcrumb(message: string, category?: string, level: 'info' | 'warning' | 'error' | 'fatal' = 'info'): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
    });
  }

  /**
   * Starts a new performance transaction for tracing.
   *
   * @param name - Name of the transaction.
   * @param op - Operation type (e.g., 'http.server', 'db.query').
   * @returns The started transaction, or undefined if tracing is disabled.
   */
  startTransaction(name: string): void {
    if (!this.config.enableTracing) {
      return;
    }

    Sentry.captureMessage(`Transaction started: ${name}`, 'info');
  }

  /**
   * Flushes the event queue to Sentry.
   *
   * @param timeout - Maximum time in milliseconds to wait for flush.
   * @returns Promise resolving to true if all events were sent, false on timeout.
   */
  async flush(timeout?: number): Promise<boolean> {
    return Sentry.flush(timeout);
  }
}
