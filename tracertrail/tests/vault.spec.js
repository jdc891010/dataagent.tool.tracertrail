
import { test, expect } from '@playwright/test';

test.describe('Knowledge Vault', () => {
  test('Create and Manage Vault Solutions', async ({ page }) => {
    // 1. Navigate to Vault
    await page.goto('/Vault');
    
    // 2. Add New Solution
    // Check if there is a button to add solution. 
    // Usually "Add Solution" or "New Entry"
    // If empty state, might be a button there.
    
    // Let's look for the button.
    // Note: The page has "Add Solution" at the top and "Add First Solution" in empty state.
    // We prefer the top one which is always there.
    await page.getByRole('button', { name: 'Add Solution' }).first().click();
    
    // 3. Fill Form (Sheet/Dialog)
    await expect(page.getByText('Add Solution to Vault')).toBeVisible();
    
    // Fill out the form
    const title = `Fix for Error ${Date.now()}`;
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Description').fill('Test problem description');
    await page.getByLabel('Code Solution').fill('Steps to solve it...');
    
    const submitBtn = page.getByRole('button', { name: 'Add to Vault' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click({ force: true });
    
    // 4. Verify in List
    // Filter by title to find the specific card
    await page.getByPlaceholder('Search solutions by title, description, or tags...').fill(title);
    await expect(page.getByText(title)).toBeVisible();
    
    // Delete
    const card = page.locator('.space-y-4 > div').filter({ hasText: title }).first();
    const deleteBtn = card.locator('.flex.gap-2 > button').nth(1);
    
    await deleteBtn.click();
    
    // 5. Verify Deletion
    await expect(page.getByText(title)).not.toBeVisible();
  });
});
