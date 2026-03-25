
import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('Update API Key and Verify System Actions', async ({ page }) => {
    // 1. Navigate to Settings
    await page.goto('/Settings');
    
    // Verify Header
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    await page.getByRole('tab', { name: 'AI Provider' }).click();
 
     // 2. Update API Key
     // Look for input with "DeepSeek API Key" label or placeholder
     // It's in the default tab "API Keys"
     const apiKeyInput = page.getByPlaceholder('sk-...');
    await expect(apiKeyInput).toBeVisible();
    
    // Fill in a test API key
    const newKey = 'sk-test-key-12345';
    await apiKeyInput.fill(newKey);
    
    await page.getByRole('button', { name: 'Save API Key' }).click();

    // Verify value persisted (reload page)
    await page.reload();
    await page.getByRole('tab', { name: 'AI Provider' }).click();
    await expect(apiKeyInput).toHaveValue(newKey);
    
    // 3. System Actions
    // Switch to "Dev" tab
    await page.getByRole('tab', { name: 'Dev' }).click();

    // Check for "Clear All Data" button
    const clearBtn = page.getByRole('button', { name: 'Clear All Data' });
    await expect(clearBtn).toBeVisible();
    
    // Test Dialog Open (Browser confirm)
    // The code uses window.confirm(), so we need to handle dialog
    
    page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('clear all data');
        await dialog.dismiss(); // Cancel
    });

    await clearBtn.click();
    
    // If we want to test accept:
    /*
    page.once('dialog', dialog => dialog.accept());
    await clearBtn.click();
    await expect(page.getByText('All data cleared')).toBeVisible();
    */
  });
});
