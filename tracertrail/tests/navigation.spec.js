import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', title: 'Home (Dashboard)', selector: 'h1:has-text("DataAgent Trace Trail")' },
  { path: '/Dashboard', title: 'Dashboard Page', selector: 'h1:has-text("DataAgent Trace Trail")' },
  { path: '/Projects', title: 'Projects', selector: 'h1:has-text("Projects")' },
    { path: '/Datasets', title: 'Datasets', selector: 'h1:has-text("Datasets")' },
    { path: '/DataSources', title: 'Data Sources', selector: 'h1:has-text("Data Sources")' },
  { path: '/DataLineage', title: 'Data Lineage', selector: 'h1:has-text("Data Lineage")' },
  { path: '/IssueAnalytics', title: 'Issue Analytics', selector: 'h1:has-text("Issue Analytics")' },
  { path: '/Settings', title: 'Settings', selector: 'h1:has-text("Settings")' },
  { path: '/Guide', title: 'Guide', selector: 'h1:has-text("DataAgent LinTrack Guide")' },
  { path: '/DataFlows', title: 'Data Flows', selector: 'h1:has-text("Data Flows")' },
  { path: '/ProjectHealth', title: 'Project Health', selector: 'h1:has-text("Project Health")' },
  { path: '/Vault', title: 'Vault', selector: 'h1:has-text("Solution Vault")' },
  { path: '/Export', title: 'Export', selector: 'h1:has-text("Export Project Data")' }
];

test.describe('Navigation', () => {
  for (const pageConfig of pages) {
    test(`Visit ${pageConfig.title}`, async ({ page }) => {
      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error')
          console.log(`Error on ${pageConfig.path}: ${msg.text()}`);
      });
      
      const response = await page.goto(pageConfig.path);
      expect(response.status()).toBe(200);
      
      // Check for common error indicators
      await expect(page.getByText('404')).not.toBeVisible();
      
      // Basic check that content loaded (not empty body)
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();

      // Check for specific page title/header
      if (pageConfig.selector) {
        await expect(page.locator(pageConfig.selector).first()).toBeVisible({ timeout: 10000 });
      }
      
      // Check for Sidebar
      await expect(page.getByTestId('sidebar-content').or(page.locator('nav'))).toBeVisible();
    });
  }
});
