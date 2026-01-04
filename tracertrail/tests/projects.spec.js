import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('Create a new project and verify it in the list', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Navigate to Projects page
    await page.goto('/Projects');
    
    // 2. Click "New Project" button
    const newProjectBtn = page.getByRole('button', { name: 'New Project' });
    await expect(newProjectBtn).toBeVisible();
    // Use force: true to ensure click works even if overlay/animations interfere
    await newProjectBtn.click({ force: true });
    
    // Wait for dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible();

    // 3. Fill the form
    const projectName = `Test Project ${Date.now()}`;
    const dialog = page.getByRole('dialog');
    const nameField = dialog.getByLabel('Project Name *');
    // Only name is required; keep interaction minimal to avoid flakiness

    await expect(nameField).toBeVisible();
    await nameField.fill(projectName);
    // Skip optional fields to improve stability
    
    // 4. Submit
    // Use force: true and specific selector for reliability
    await page.locator('button[type="submit"]').click({ force: true });
    
    // 5. Verify navigation back to list or success message
    // Assuming it navigates back to list or stays on list with new item
    // It might take a moment for the list to update
    await expect(page.getByText(projectName)).toBeVisible();
  });
});
