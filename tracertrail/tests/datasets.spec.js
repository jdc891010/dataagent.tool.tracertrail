import { test, expect } from '@playwright/test';

test.describe('Datasets', () => {
  let projectName;

  test.beforeEach(async ({ page }) => {
    // Create a project first
    projectName = `Project for Dataset ${Date.now()}`;
    await page.goto('/Projects');
    await page.getByRole('button', { name: 'New Project' }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await page.locator('#name').fill(projectName);
    await page.locator('#client').fill('Test Client');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(projectName)).toBeVisible();
  });

  test('Create a new dataset and verify', async ({ page }) => {
    test.setTimeout(60000); // Extend timeout
    // 1. Navigate to Datasets page
    await page.goto('/Datasets');
    
    // 2. Click "New Dataset"
    await page.getByRole('button', { name: 'New Dataset' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // 3. Fill form
    const datasetName = `Test Dataset ${Date.now()}`;
    await page.locator('#name').fill(datasetName);
    
    // Select Project (1st Select)
    // Using nth(0) for the first combobox (Project)
    await page.locator('button[role="combobox"]').nth(0).click();
    await page.getByRole('option', { name: projectName }).click();

    await page.locator('#description').fill('Test Dataset Description');
    await page.locator('#client').fill('Test Client');
    await page.locator('#data_steward').fill('Jane Doe');
    await page.locator('#data_owner').fill('John Doe');
    await page.locator('#source_system').fill('ERP');
    
    // Select Source Type (2nd Select)
    await page.locator('button[role="combobox"]').nth(1).click();
    await page.getByRole('option', { name: 'Database' }).click();
    
    // 4. Submit
    await page.getByRole('button', { name: 'Create Dataset' }).click();
    
    // 5. Verify
    await expect(page.getByText(datasetName)).toBeVisible();
    
    // 6. View Detail
    await page.getByText(datasetName).click();
    await expect(page).toHaveURL(/.*DatasetDetail/i);
    await expect(page.getByText(datasetName)).toBeVisible();
  });
});
