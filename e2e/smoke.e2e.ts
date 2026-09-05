import { test, expect } from '@playwright/test';

/**
 * Smoke: chapter loads, pagination works, verse modal opens.
 */
test.describe('reader smoke', () => {
  test('loads GEN 1 and shows verse text', async ({ page }) => {
    await page.goto('/');
    // Loading state mentions the version short name
    await expect(page.getByText(/Cargando Sagradas Escrituras/i)).toBeVisible({ timeout: 10_000 }).catch(() => {});
    // Chapter header appears once the payload arrives
    await expect(page.getByRole('heading', { name: /Capítulo 1/i })).toBeVisible({ timeout: 20_000 });
    // At least one verse number button is rendered
    const verseButtons = page.getByRole('button', { name: /Versículo \d+/i });
    await expect(verseButtons.first()).toBeVisible();
  });

  test('paginates with ArrowRight', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Capítulo 1/i })).toBeVisible({ timeout: 20_000 });
    const status = page.getByRole('status');
    const before = (await status.textContent()) || '';
    await page.keyboard.press('ArrowRight');
    // Page indicator in footer changes (Pág. 1/N → 2/N) when more than one page exists;
    // otherwise the chapter is single-page and nothing changes — both are valid.
    await expect(async () => {
      const after = (await status.textContent()) || '';
      const footer = (await page.getByText(/Pág\. \d+\/\d+/).first().textContent()) || '';
      expect(after !== before || /Pág\. 1\/1/.test(footer)).toBe(true);
    }).toPass({ timeout: 5_000 });
  });

  test('opens verse modal on verse click', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Capítulo 1/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Versículo 1\./i }).first().click();
    await expect(page.getByRole('button', { name: /Copiar/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /Guardar/i })).toBeVisible();
  });
});
