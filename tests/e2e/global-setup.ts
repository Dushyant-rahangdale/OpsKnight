import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright E2E tests.
 * This runs once before all tests.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('Running global setup for E2E tests...');

  // Validate environment
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  console.log(`Base URL: ${baseURL}`);

  // In CI, we could seed test data here
  if (process.env.CI) {
    console.log('CI environment detected - skipping data seeding');
  }

  console.log('Global setup complete');
}

export default globalSetup;
