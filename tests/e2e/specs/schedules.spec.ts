import { test, expect } from '../fixtures/auth.fixture';

test.describe('Schedules', () => {
  test.describe('Schedule List', () => {
    test('should display schedules page', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      await expect(page.getByRole('heading', { name: /schedules|on-call/i })).toBeVisible();
    });

    test('should show create schedule button', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      await expect(page.getByRole('button', { name: /create|new|add/i })).toBeVisible();
    });

    test('should display existing schedules', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      // Wait for list to load
      await page.waitForLoadState('networkidle');

      // Check for schedule items or empty state
      const hasSchedules = (await page.locator('[data-testid="schedule-item"]').count()) > 0;
      const hasEmptyState = await page.getByText(/no schedules|create your first/i).isVisible();

      expect(hasSchedules || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Create Schedule', () => {
    test('should open schedule creation form', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      await page.getByRole('button', { name: /create|new|add/i }).click();

      // Should show form
      await expect(page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i))).toBeVisible({
        timeout: 5000,
      });
    });

    test('should create a new schedule', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      await page.getByRole('button', { name: /create|new|add/i }).click();

      // Fill schedule name
      const nameField = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i));
      await nameField.fill('E2E Test Schedule');

      // Fill description if available
      const descField = page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i));
      if (await descField.isVisible()) {
        await descField.fill('Test schedule created by E2E tests');
      }

      // Select timezone if available
      const tzSelect = page.getByLabel(/timezone/i);
      if (await tzSelect.isVisible()) {
        await tzSelect.click();
        await page.getByRole('option').first().click();
      }

      // Submit
      await page.getByRole('button', { name: /create|save|submit/i }).click();

      // Should show success or navigate
      await expect(
        page
          .getByText(/created|success/i)
          .or(page.getByRole('heading', { name: /E2E Test Schedule/i }))
      ).toBeVisible({ timeout: 10000 });
    });

    test('should validate schedule name is required', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      await page.getByRole('button', { name: /create|new|add/i }).click();

      // Try to submit without name
      await page.getByRole('button', { name: /create|save|submit/i }).click();

      // Should show validation error
      await expect(page.getByText(/required|please enter|name is required/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Schedule Detail', () => {
    test('should view schedule details', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      // Click on first schedule
      const scheduleLink = page
        .locator('[data-testid="schedule-item"]')
        .first()
        .or(page.getByRole('link', { name: /schedule/i }).first());

      if (await scheduleLink.isVisible()) {
        await scheduleLink.click();

        // Should show schedule details
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display schedule calendar view', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      // Navigate to a schedule
      const scheduleLink = page.locator('[data-testid="schedule-item"]').first();
      if (await scheduleLink.isVisible()) {
        await scheduleLink.click();

        // Look for calendar/timeline view
        const calendarView = page
          .locator('[data-testid="schedule-calendar"]')
          .or(page.locator('.schedule-timeline').or(page.getByRole('grid')));

        await expect(calendarView).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Schedule Overrides', () => {
    test('should open override creation form', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      // Navigate to a schedule
      const scheduleLink = page.locator('[data-testid="schedule-item"]').first();
      if (await scheduleLink.isVisible()) {
        await scheduleLink.click();

        // Look for override button
        const overrideButton = page.getByRole('button', { name: /override|swap|add override/i });
        if (await overrideButton.isVisible()) {
          await overrideButton.click();

          // Should show override form
          await expect(page.getByRole('dialog').or(page.getByLabel(/user|member/i))).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });

    test('should create a schedule override', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      const scheduleLink = page.locator('[data-testid="schedule-item"]').first();
      if (await scheduleLink.isVisible()) {
        await scheduleLink.click();

        const overrideButton = page.getByRole('button', { name: /override|swap|add override/i });
        if (await overrideButton.isVisible()) {
          await overrideButton.click();

          // Select user if dropdown available
          const userSelect = page.getByLabel(/user|member/i);
          if (await userSelect.isVisible()) {
            await userSelect.click();
            await page.getByRole('option').first().click();
          }

          // Set dates if available
          const startDate = page.getByLabel(/start/i);
          if (await startDate.isVisible()) {
            await startDate.fill(new Date().toISOString().split('T')[0]);
          }

          // Submit
          const submitButton = page.getByRole('button', { name: /create|save|submit/i });
          await submitButton.click();

          // Should show success
          await expect(page.getByText(/override|created|success/i)).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe('Edit Schedule', () => {
    test('should edit schedule settings', async ({ authenticatedPage: page }) => {
      await page.goto('/schedules');

      const scheduleLink = page.locator('[data-testid="schedule-item"]').first();
      if (await scheduleLink.isVisible()) {
        await scheduleLink.click();

        // Find edit button
        const editButton = page.getByRole('button', { name: /edit|settings/i });
        if (await editButton.isVisible()) {
          await editButton.click();

          // Update name
          const nameField = page.getByLabel(/name/i);
          await nameField.fill('Updated Schedule Name');

          // Save
          await page.getByRole('button', { name: /save|update/i }).click();

          // Should show success
          await expect(page.getByText(/updated|saved|success/i)).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });
});
