import { test, expect } from '@playwright/test';

test.describe('Datasets', () => {
  let projectName;

  test.beforeEach(async ({ page }) => {
    // Create a project first
    projectName = `Project for Dataset ${Date.now()}`;
    await page.goto('/Projects');
    await page.getByRole('button', { name: 'New Project' }).click();
    await page.getByLabel('Name').fill(projectName);
    await page.getByLabel('Client').fill('Test Client');
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByText(projectName)).toBeVisible();
  });

  test('Create a new dataset and verify', async ({ page }) => {
    // 1. Navigate to Datasets page
    await page.goto('/Datasets');
    
    // 2. Click "New Dataset"
    await page.getByRole('button', { name: 'New Dataset' }).click();
    
    // 3. Fill form
    const datasetName = `Test Dataset ${Date.now()}`;
    await page.getByLabel('Name').fill(datasetName);
    
    // Select Project
    // Shadcn select is a bit tricky. It uses a button trigger.
    // The label is "Project", so the trigger is likely following it or associated.
    // Usually `page.getByLabel('Project')` might target the hidden input or the button.
    // Let's try to click the trigger.
    await page.locator('button[role="combobox"]').first().click(); // Assuming it's the first combo box or use specific selector
    // Or better, find the trigger by nearby text
    // In DatasetForm, the Select for project is the first one.
    // Let's try specific locator if label doesn't work.
    
    // Trying to find the project item in the dropdown
    await page.getByRole('option', { name: projectName }).click();

    await page.getByLabel('Description').fill('Test Dataset Description');
    await page.getByLabel('Client').fill('Test Client');
    await page.getByLabel('Data Steward').fill('Jane Doe');
    await page.getByLabel('Data Owner').fill('John Doe');
    await page.getByLabel('Source System').fill('ERP');
    
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
