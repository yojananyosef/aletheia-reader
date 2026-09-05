import { test, expect } from '@playwright/test';

/**
 * Smoke: version switch reloads the catalog without losing the reader.
 */
test.describe('version switch smoke', () => {
  test('switches ONBV → RV1909 from the toolbar pill', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Capítulo 1/i })).toBeVisible({ timeout: 20_000 });

    // Open the toolbar version pill (desktop viewport) and pick RV1909
    const pill = page.getByRole('button', { name: /Traducción actual/i }).first();
    await pill.click();
    await page.getByRole('option', { name: /RV1909/i }).click();

    // Reader reloads the chapter under the new version
    await expect(page.getByRole('heading', { name: /Capítulo 1/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Traducción actual: RV1909/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
