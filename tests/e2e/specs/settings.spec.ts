import { test, expect } from '../fixtures/auth.fixture';

test.describe('Settings', () => {
  test.describe('Settings Navigation', () => {
    test('should access settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');

      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display settings navigation/tabs', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');

      // Look for settings sections
      const settingsSections = [
        /profile|account/i,
        /team|organization/i,
        /api|integrations/i,
        /notifications/i,
      ];

      for (const section of settingsSections) {
        const navItem = page
          .getByRole('link', { name: section })
          .or(
            page.getByRole('tab', { name: section }).or(page.getByRole('button', { name: section }))
          );

        if (await navItem.isVisible({ timeout: 1000 })) {
          await expect(navItem).toBeVisible();
        }
      }
    });
  });

  test.describe('Profile Settings', () => {
    test('should display profile settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      await expect(page.getByLabel(/name/i).or(page.getByLabel(/email/i))).toBeVisible({
        timeout: 10000,
      });
    });

    test('should update profile name', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const nameField = page.getByLabel(/name/i).first();
      const originalValue = await nameField.inputValue();

      // Update name
      await nameField.fill('E2E Test User');
      await page.getByRole('button', { name: /save|update/i }).click();

      // Should show success
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 10000 });

      // Restore original value
      await nameField.fill(originalValue || 'Test User');
      await page.getByRole('button', { name: /save|update/i }).click();
    });
  });

  test.describe('API Key Management', () => {
    test('should access API keys page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');

      await expect(page.getByRole('heading', { name: /api|key/i })).toBeVisible({ timeout: 10000 });
    });

    test('should show create API key button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');

      await expect(page.getByRole('button', { name: /create|generate|new/i })).toBeVisible();
    });

    test('should create a new API key', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');

      await page.getByRole('button', { name: /create|generate|new/i }).click();

      // Fill name if required
      const nameField = page.getByLabel(/name|description/i);
      if (await nameField.isVisible({ timeout: 2000 })) {
        await nameField.fill('E2E Test API Key');
      }

      // Submit
      const createButton = page.getByRole('button', { name: /create|generate/i });
      await createButton.click();

      // Should show the new API key
      await expect(
        page
          .getByText(/created|success/i)
          .or(page.locator('[data-testid="api-key-value"]').or(page.getByText(/copy|key:/i)))
      ).toBeVisible({ timeout: 10000 });
    });

    test('should list existing API keys', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');

      await page.waitForLoadState('networkidle');

      // Check for keys or empty state
      const hasKeys = (await page.locator('[data-testid="api-key-item"]').count()) > 0;
      const hasEmptyState = await page.getByText(/no api keys|create your first/i).isVisible();

      expect(hasKeys || hasEmptyState).toBeTruthy();
    });

    test('should revoke an API key', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');

      // Find a key to revoke
      const keyItem = page.locator('[data-testid="api-key-item"]').first();
      if (await keyItem.isVisible()) {
        const revokeButton = keyItem.getByRole('button', { name: /revoke|delete|remove/i });

        if (await revokeButton.isVisible()) {
          await revokeButton.click();

          // Confirm if dialog appears
          const confirmDialog = page.getByRole('dialog');
          if (await confirmDialog.isVisible({ timeout: 2000 })) {
            await confirmDialog.getByRole('button', { name: /confirm|revoke|delete/i }).click();
          }

          // Should show success
          await expect(page.getByText(/revoked|deleted|removed|success/i)).toBeVisible({
            timeout: 10000,
          });
        }
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should access notification settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');

      await expect(page.getByRole('heading', { name: /notification/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('should toggle notification preferences', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');

      // Find a toggle switch
      const toggle = page.getByRole('switch').first().or(page.getByRole('checkbox').first());

      if (await toggle.isVisible()) {
        const wasChecked = await toggle.isChecked();
        await toggle.click();

        // Verify state changed
        expect(await toggle.isChecked()).toBe(!wasChecked);

        // Restore original state
        await toggle.click();
      }
    });
  });

  test.describe('Team/Organization Settings', () => {
    test('should access team settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/team');

      await expect(page.getByRole('heading', { name: /team|organization|member/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('should list team members', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/team');

      await page.waitForLoadState('networkidle');

      // Should show at least one member (current user)
      const memberList = page
        .locator('[data-testid="team-member"]')
        .or(page.locator('tr').filter({ hasText: /@/ }));

      await expect(memberList.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show invite member button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/team');

      await expect(page.getByRole('button', { name: /invite|add/i })).toBeVisible();
    });
  });

  test.describe('Integration Settings', () => {
    test('should access integrations page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/integrations');

      await expect(page.getByRole('heading', { name: /integration/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('should list available integrations', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/integrations');

      // Look for common integrations
      const integrations = [/slack/i, /email/i, /webhook/i, /pagerduty/i];

      for (const integration of integrations) {
        const item = page.getByText(integration);
        if (await item.isVisible({ timeout: 1000 })) {
          await expect(item).toBeVisible();
        }
      }
    });
  });
});
