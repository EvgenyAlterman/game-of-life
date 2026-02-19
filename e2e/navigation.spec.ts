import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('sidebar tabs switch panels', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to initialize — canvas is rendered by JS
    await expect(page.locator('#gameCanvas')).toBeVisible();

    const controlsBtn = page.locator('.sidebar-nav-btn[data-tab="controls"]');
    const toolsBtn = page.locator('.sidebar-nav-btn[data-tab="tools"]');
    const patternsBtn = page.locator('.sidebar-nav-btn[data-tab="patterns"]');
    const recordingsBtn = page.locator('.sidebar-nav-btn[data-tab="recordings"]');

    // Click Controls tab to ensure it's active (app may restore a different tab)
    await controlsBtn.click();
    await expect(controlsBtn).toHaveClass(/active/);
    await expect(page.locator('.sidebar-panel[data-panel="controls"]')).toHaveClass(/active/);

    // Switch to Tools tab
    await toolsBtn.click();
    await expect(toolsBtn).toHaveClass(/active/);
    await expect(page.locator('.sidebar-panel[data-panel="tools"]')).toHaveClass(/active/);
    await expect(controlsBtn).not.toHaveClass(/active/);

    // Switch to Patterns tab
    await patternsBtn.click();
    await expect(patternsBtn).toHaveClass(/active/);
    await expect(page.locator('.sidebar-panel[data-panel="patterns"]')).toHaveClass(/active/);

    // Switch to Recordings tab
    await recordingsBtn.click();
    await expect(recordingsBtn).toHaveClass(/active/);
    await expect(page.locator('.sidebar-panel[data-panel="recordings"]')).toHaveClass(/active/);
  });

  test('help link navigates to explanation page', async ({ page }) => {
    await page.goto('/');

    const helpBtn = page.locator('a.help-btn');
    await expect(helpBtn).toBeVisible();

    await helpBtn.click();
    await expect(page).toHaveURL(/explanation\.html/);
    await expect(page.locator('text=Complete Guide to Cellular Automata')).toBeVisible();
  });

  test('explanation page links back to main app', async ({ page }) => {
    await page.goto('/explanation.html');

    const backLink = page.locator('a.back-link').first();
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL(/index\.html|\/$/);
    await expect(page.locator('h1', { hasText: 'Game of Life Studio' })).toBeVisible();
  });
});
