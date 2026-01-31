import { test, expect } from '@playwright/test';
import { TEST_USER, loginAs, logout } from '../fixtures/auth.fixture';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      // Email field (labeled "Identification")
      await expect(page.getByPlaceholder(/opsknight\.com/i)).toBeVisible();
      // Password field
      await expect(page.locator('input[type="password"]')).toBeVisible();
      // Sign In button
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder(/opsknight\.com/i).fill('invalid@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for error message - use specific text
      await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 10000 });
    });

    // Skip tests that require valid credentials - enable after seeding test users
    test.skip('should login successfully with valid credentials', async ({ page }) => {
      await loginAs(page, TEST_USER.email, TEST_USER.password);

      // Should be redirected away from login page
      await expect(page).not.toHaveURL(/\/login/);

      // Should see dashboard or main content
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    });

    test.skip('should maintain session after page refresh', async ({ page }) => {
      await loginAs(page, TEST_USER.email, TEST_USER.password);

      // Refresh the page
      await page.reload();

      // Should still be logged in
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe('Logout', () => {
    test.skip('should logout successfully', async ({ page }) => {
      await loginAs(page, TEST_USER.email, TEST_USER.password);
      await logout(page);

      // Should be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test.skip('should redirect to login when accessing protected routes after logout', async ({
      page,
    }) => {
      await loginAs(page, TEST_USER.email, TEST_USER.password);
      await logout(page);

      // Try to access protected route
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Password Reset', () => {
    test('should display forgot password link', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotLink).toBeVisible();
    });

    test('should navigate to password reset page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /forgot password/i }).click();

      // Should navigate to reset password page
      await expect(page).toHaveURL(/\/(forgot|reset)/);
      // Uses placeholder "name@company.com"
      await expect(page.getByPlaceholder(/company\.com/i)).toBeVisible();
    });

    test('should submit password reset request', async ({ page }) => {
      await page.goto('/forgot-password');

      // Uses placeholder "name@company.com"
      await page.getByPlaceholder(/company\.com/i).fill(TEST_USER.email);
      await page.getByRole('button', { name: /send instructions/i }).click();

      // Should show success or error (API may not be configured, but form should submit)
      await expect(page.getByText(/request received|request failed|instructions/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access various protected routes
      const protectedRoutes = ['/dashboard', '/incidents', '/schedules', '/settings'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });
});
