import * as Sentry from '@sentry/react';

/**
 * Initializes Sentry for the web application.
 *
 * @remarks
 * Should be called as early as possible in the application lifecycle,
 * before any other code runs.
 */
export function initSentry(): void {
  const tracesSampleRate = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ? parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) : undefined;
  const profilesSampleRate = import.meta.env.VITE_SENTRY_PROFILES_SAMPLE_RATE ? parseFloat(import.meta.env.VITE_SENTRY_PROFILES_SAMPLE_RATE) : undefined;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate,
    profilesSampleRate,
    debug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
