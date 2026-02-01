/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js at startup.
 * It runs once when the server starts, before any requests are handled.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run validation in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Skip validation during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return;
    }

    // Validate production environment variables at startup
    const { validateProductionEnv } = await import('./lib/env-validation');
    validateProductionEnv();

    // Start the cron scheduler for background jobs
    const { startCronScheduler } = await import('./lib/cron-scheduler');
    startCronScheduler();
  }
}
