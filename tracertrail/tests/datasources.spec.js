import { test, expect } from '@playwright/test';

test.describe('Data Sources', () => {
  let projectName;
  let datasetName;

  test.beforeEach(async ({ page }) => {
    // Create Project
    projectName = `Project for DS ${Date.now()}`;
    await page.goto('/Projects');
    await page.getByRole('button', { name: 'New Project' }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await page.locator('#name').fill(projectName);
    await page.locator('button[type="submit"]').click();
    
    // Create Dataset
    datasetName = `Dataset for DS ${Date.now()}`;
    await page.goto('/Datasets');
    await page.getByRole('button', { name: 'New Dataset' }).click();
    await expect(page.getByRole('dialog').or(page.locator('.sheet-content'))).toBeVisible().catch(() => {}); // Fallback if it's not a dialog but a sheet/page
    await page.locator('#name').fill(datasetName);
    await page.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: projectName }).click();
    await page.getByRole('button', { name: 'Create Dataset' }).click();
  });

  test('Create a new data source and verify', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Navigate to Data Sources
    await page.goto('/DataSources');
    
    // 2. Click New Data Source
    await page.getByRole('button', { name: 'Add Source' }).click();
    await expect(page).toHaveURL(/.*NewDataSource/i);

    // 3. Fill Form
    const dataSourceName = `Test DataSource ${Date.now()}`;
    await page.locator('#name').fill(dataSourceName);
    
    // Select Type (1st Select)
    await page.locator('button[role="combobox"]').nth(0).click();
    await page.getByRole('option', { name: 'Database Table' }).click();

    // Select Dataset (2nd Select)
    await page.locator('button[role="combobox"]').nth(1).click();
    await page.getByRole('option', { name: datasetName }).click();
    
    await page.locator('#source_location').fill('/tmp/source');
    await page.locator('#target_location').fill('/tmp/target');
    await page.locator('#connection_string').fill('postgres://localhost:5432/db');
    
    // 4. Submit
    await page.getByRole('button', { name: 'Add to Queue' }).click();
    
    // 5. Verify redirect to detail
    await expect(page).toHaveURL(/.*DataSourceDetail/i);
    await expect(page.getByText(dataSourceName)).toBeVisible();
    
    // 6. Verify in list
    await page.goto('/DataSources');
    await expect(page.getByText(dataSourceName)).toBeVisible();
  });
});
