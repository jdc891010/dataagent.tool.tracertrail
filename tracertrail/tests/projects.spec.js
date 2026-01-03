import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('Create a new project and verify it in the list', async ({ page }) => {
    // 1. Navigate to Projects page
    await page.goto('/Projects');
    
    // 2. Click "New Project" button
    await page.getByRole('button', { name: 'New Project' }).click();
    
    // 3. Fill the form
    const projectName = `Test Project ${Date.now()}`;
    await page.getByLabel('Name').fill(projectName);
    await page.getByLabel('Description').fill('This is a test project created by Playwright');
    await page.getByLabel('Client').fill('Test Client');
    await page.getByLabel('Data Steward').fill('Jane Doe');
    await page.getByLabel('Data Owner').fill('John Doe');
    
    // 4. Submit
    await page.getByRole('button', { name: 'Create Project' }).click();
    
    // 5. Verify navigation back to list or success message
    // Assuming it navigates back to list or stays on list with new item
    // Based on standard behavior, it likely closes modal or navigates
    
    // Wait for the project to appear in the list
    await expect(page.getByText(projectName)).toBeVisible();
    
    // 6. View Detail
    await page.getByText(projectName).click();
    await expect(page).toHaveURL(/.*ProjectDetail/i);
    await expect(page.getByText(projectName)).toBeVisible();
  });
});
