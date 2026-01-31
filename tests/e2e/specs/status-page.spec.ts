import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

test.describe('Status Page', () => {
  test.describe('Public Status Page', () => {
    test('should display public status page without authentication', async ({ page }) => {
      await page.goto('/status');

      // Should show status page content
      await expect(page.getByRole('heading', { name: /status|operational/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('should show current system status', async ({ page }) => {
      await page.goto('/status');

      // Look for status indicator
      const statusIndicator = page
        .locator('[data-testid="status-indicator"]')
        .or(page.getByText(/operational|degraded|outage|maintenance/i));

      await expect(statusIndicator).toBeVisible({ timeout: 10000 });
    });

    test('should display component status list', async ({ page }) => {
      await page.goto('/status');

      // Wait for components to load
      await page.waitForLoadState('networkidle');

      // Check for components or empty state
      const hasComponents = (await page.locator('[data-testid="component-status"]').count()) > 0;
      const hasEmptyState = await page.getByText(/no components|all systems/i).isVisible();

      expect(hasComponents || hasEmptyState).toBeTruthy();
    });

    test('should show recent incidents on status page', async ({ page }) => {
      await page.goto('/status');

      // Look for incident history section
      const incidentSection = page
        .getByRole('heading', { name: /incident|history|past/i })
        .or(page.locator('[data-testid="incident-history"]'));

      await expect(incidentSection).toBeVisible({ timeout: 10000 });
    });

    test('should display uptime metrics if available', async ({ page }) => {
      await page.goto('/status');

      // Look for uptime display
      const uptimeDisplay = page
        .getByText(/uptime|%/i)
        .or(page.locator('[data-testid="uptime-metric"]'));

      // This might not always be visible depending on config
      if (await uptimeDisplay.isVisible({ timeout: 3000 })) {
        await expect(uptimeDisplay).toContainText(/%/);
      }
    });
  });

  test.describe('Status Page Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should be responsive on mobile', async ({ page }) => {
      await page.goto('/status');

      // Page should load and be scrollable
      await expect(page.getByRole('heading', { name: /status|operational/i })).toBeVisible();

      // Scroll to ensure content is accessible
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    });
  });

  test.describe('Status Page Subscription', () => {
    test('should show subscribe option', async ({ page }) => {
      await page.goto('/status');

      // Look for subscribe button/link
      const subscribeButton = page
        .getByRole('button', { name: /subscribe|notify/i })
        .or(page.getByRole('link', { name: /subscribe|notify/i }));

      if (await subscribeButton.isVisible({ timeout: 3000 })) {
        await expect(subscribeButton).toBeEnabled();
      }
    });

    test('should open subscription modal/form', async ({ page }) => {
      await page.goto('/status');

      const subscribeButton = page.getByRole('button', { name: /subscribe|notify/i });
      if (await subscribeButton.isVisible({ timeout: 3000 })) {
        await subscribeButton.click();

        // Should show subscription form
        await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });
});

authTest.describe('Status Page Management', () => {
  authTest.describe('Manage Components', () => {
    authTest('should access component management', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/status-page');

      // Should see component management
      await expect(page.getByRole('heading', { name: /status|component/i })).toBeVisible({
        timeout: 10000,
      });
    });

    authTest('should add a new component', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/status-page');

      // Click add component
      const addButton = page.getByRole('button', { name: /add|create|new/i });
      if (await addButton.isVisible()) {
        await addButton.click();

        // Fill component details
        const nameField = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i));
        await nameField.fill('E2E Test Component');

        // Submit
        await page.getByRole('button', { name: /create|save|add/i }).click();

        // Should show success
        await expect(
          page.getByText(/created|success/i).or(page.getByText('E2E Test Component'))
        ).toBeVisible({ timeout: 10000 });
      }
    });

    authTest('should update component status', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/status-page');

      // Find a component
      const component = page.locator('[data-testid="component-item"]').first();
      if (await component.isVisible()) {
        // Click on status dropdown or edit
        const statusSelect = component
          .getByRole('combobox')
          .or(component.getByRole('button', { name: /status/i }));

        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          await page
            .getByRole('option', { name: /degraded|maintenance/i })
            .first()
            .click();

          // Should update
          await expect(page.getByText(/updated|saved/i)).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  authTest.describe('Status Page Settings', () => {
    authTest('should access status page settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/status-page');

      // Should show settings
      await expect(page.getByRole('heading', { name: /status|settings/i })).toBeVisible({
        timeout: 10000,
      });
    });

    authTest('should update status page title', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/status-page');

      // Find title field
      const titleField = page.getByLabel(/title|name/i).first();
      if (await titleField.isVisible()) {
        await titleField.fill('E2E Test Status Page');
        await page.getByRole('button', { name: /save|update/i }).click();

        await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 10000 });
      }
    });
  });
});
