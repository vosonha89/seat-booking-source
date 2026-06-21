export interface IBaseLoggingConfig {
  readonly dsn?: string;
  readonly environment?: string;
  readonly release?: string;
  readonly tracesSampleRate?: number;
  readonly profilesSampleRate?: number;
  readonly debug?: boolean;
  readonly enablePerformanceMonitoring?: boolean;
  readonly enableTracing?: boolean;
}

export interface IBaseLoggingService {
  captureException(error: Error, context?: Record<string, unknown>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: Record<string, unknown>): void;
  setUser(userId: string, email?: string, username?: string): void;
  clearUser(): void;
  addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error' | 'fatal'): void;
  startTransaction(name: string): void;
  flush(timeout?: number): Promise<boolean>;
}
