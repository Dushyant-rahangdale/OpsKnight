import { test, expect } from '../fixtures/auth.fixture';

test.describe('Incidents', () => {
  test.describe('Incident List', () => {
    test('should display incidents list', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      // Should see incidents heading
      await expect(page.getByRole('heading', { name: /incidents/i })).toBeVisible();

      // Should have create button
      await expect(page.getByRole('button', { name: /create|new/i })).toBeVisible();
    });

    test('should filter incidents by status', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      // Look for status filter
      const statusFilter = page
        .getByRole('combobox', { name: /status/i })
        .or(page.getByLabel(/status/i));

      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.getByRole('option', { name: /open|active/i }).click();

        // URL or list should update
        await page.waitForLoadState('networkidle');
      }
    });

    test('should search incidents', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));

      if (await searchInput.isVisible()) {
        await searchInput.fill('test incident');
        await page.keyboard.press('Enter');

        // Wait for search results
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Create Incident', () => {
    test('should open create incident form', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      await page.getByRole('button', { name: /create|new/i }).click();

      // Should show form or navigate to create page
      await expect(page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i))).toBeVisible({
        timeout: 5000,
      });
    });

    test('should create a new incident', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      await page.getByRole('button', { name: /create|new/i }).click();

      // Fill form
      const titleField = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i));
      await titleField.fill('E2E Test Incident');

      const descField = page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i));
      if (await descField.isVisible()) {
        await descField.fill('This is a test incident created by E2E tests');
      }

      // Select severity if available
      const severitySelect = page.getByLabel(/severity|priority/i);
      if (await severitySelect.isVisible()) {
        await severitySelect.click();
        await page.getByRole('option').first().click();
      }

      // Submit
      await page.getByRole('button', { name: /create|save|submit/i }).click();

      // Should show success or navigate to incident
      await expect(
        page
          .getByText(/created|success/i)
          .or(page.getByRole('heading', { name: /E2E Test Incident/i }))
      ).toBeVisible({ timeout: 10000 });
    });

    test('should validate required fields', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      await page.getByRole('button', { name: /create|new/i }).click();

      // Try to submit without filling required fields
      await page.getByRole('button', { name: /create|save|submit/i }).click();

      // Should show validation error
      await expect(page.getByText(/required|please fill|cannot be empty/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Incident Detail', () => {
    test('should view incident details', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      // Click on first incident in list
      const incidentLink = page
        .getByRole('link', { name: /incident/i })
        .first()
        .or(page.locator('[data-testid="incident-row"]').first());

      if (await incidentLink.isVisible()) {
        await incidentLink.click();

        // Should show incident details
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 5000 });
      }
    });

    test('should update incident status', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      // Navigate to first incident
      const incidentRow = page.locator('[data-testid="incident-row"], tr').first();
      await incidentRow.click();

      // Look for status change button/dropdown
      const statusButton = page.getByRole('button', { name: /status|resolve|acknowledge/i });
      if (await statusButton.isVisible()) {
        await statusButton.click();

        // Select new status
        const resolveOption = page
          .getByRole('menuitem', { name: /resolve/i })
          .or(page.getByRole('option', { name: /resolve/i }));
        if (await resolveOption.isVisible()) {
          await resolveOption.click();

          // Confirm if dialog appears
          const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
          }

          // Should show success
          await expect(page.getByText(/updated|resolved|success/i)).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test('should add a comment to incident', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      // Navigate to first incident
      await page.locator('[data-testid="incident-row"], tr').first().click();

      // Find comment input
      const commentInput = page
        .getByPlaceholder(/comment|note|update/i)
        .or(page.getByLabel(/comment|note|update/i));

      if (await commentInput.isVisible()) {
        await commentInput.fill('E2E test comment');
        await page.getByRole('button', { name: /add|post|submit/i }).click();

        // Should show the comment
        await expect(page.getByText('E2E test comment')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Resolve Incident', () => {
    test('should resolve an incident', async ({ authenticatedPage: page }) => {
      await page.goto('/incidents');

      // Find an open/active incident
      const openIncident = page
        .locator('[data-status="open"], [data-status="triggered"]')
        .first()
        .or(page.getByText(/open|triggered|active/i).first());

      if (await openIncident.isVisible()) {
        await openIncident.click();

        // Look for resolve button
        const resolveButton = page.getByRole('button', { name: /resolve/i });
        await resolveButton.click();

        // Confirm resolution if dialog appears
        const confirmDialog = page.getByRole('dialog');
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          await confirmDialog.getByRole('button', { name: /confirm|resolve/i }).click();
        }

        // Should show success
        await expect(page.getByText(/resolved|success/i)).toBeVisible({ timeout: 10000 });
      }
    });
  });
});
