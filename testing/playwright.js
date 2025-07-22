/**
 * Playwright test setup for 5e Sheet Notes & Trackers
 */

import { test, expect } from '@playwright/test';

test.describe('5e Sheet Notes & Trackers', () => {
  test('module loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for Foundry to load
    await page.waitForSelector('#logo', { timeout: 30000 });
    
    // Login as admin
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Wait for world to load
    await page.waitForSelector('#sidebar', { timeout: 30000 });
    
    // Check module is active
    const moduleActive = await page.evaluate(() => {
      return game.modules.get('foundryvtt-5e-sheet-notes')?.active;
    });
    
    expect(moduleActive).toBe(true);
  });
});