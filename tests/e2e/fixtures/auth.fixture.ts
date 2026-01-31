import { test as base, Page } from '@playwright/test';

// Test user credentials (should match seeded test data)
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'testpassword123',
  name: 'Test User',
};

export const ADMIN_USER = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.E2E_ADMIN_PASSWORD || 'adminpassword123',
  name: 'Admin User',
};

/**
 * Extended test fixtures with authentication helpers.
 */
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
}>({
  /**
   * Page authenticated as a regular test user.
   */
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
    await use(page);
  },

  /**
   * Page authenticated as an admin user.
   */
  adminPage: async ({ page }, use) => {
    await loginAs(page, ADMIN_USER.email, ADMIN_USER.password);
    await use(page);
  },
});

/**
 * Login helper function.
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');

  // Fill email field (labeled "Identification" with placeholder "you@opsknight.com")
  await page.getByPlaceholder(/opsknight\.com/i).fill(email);

  // Fill password field (labeled "Access Key")
  await page.locator('input[type="password"]').fill(password);

  // Click Sign In button
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for successful redirect (dashboard or home)
  await page.waitForURL(/\/(dashboard|home|incidents)?$/, { timeout: 15000 });
}

/**
 * Logout helper function.
 */
export async function logout(page: Page): Promise<void> {
  // Look for user menu or logout button
  const userMenu = page.getByRole('button', { name: /user|account|profile/i });
  if (await userMenu.isVisible()) {
    await userMenu.click();
  }

  await page.getByRole('menuitem', { name: /log out|sign out/i }).click();
  await page.waitForURL(/\/login/);
}

export { expect } from '@playwright/test';
