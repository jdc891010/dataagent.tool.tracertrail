
import { test, expect } from '@playwright/test';

test.describe('Knowledge Vault', () => {
  test('Create and Manage Vault Solutions', async ({ page, request }) => {
    test.setTimeout(180000);
    // 1. Navigate to Vault
    await page.goto('/Vault');
    const title = `Fix for Error ${Date.now()}`;
    
    // 2. Create via API for stability
    const create = await request.post('/api/vault', {
      data: { title, code: 'Steps to solve it...', language: 'sql' }
    });
    expect(create.ok()).toBeTruthy();
    await page.reload();
    
    // 4. Verify in List
    // Filter by title to find the specific card
    await page.getByPlaceholder('Search solutions by title, description, or tags...').fill(title);
    await expect(page.getByText(title)).toBeVisible();
    
    // Delete via API for stability
    const listResp = await request.get('/api/vault');
    expect(listResp.ok()).toBeTruthy();
    const items = await listResp.json();
    const created = items.find(i => i.title === title);
    if (created?.id) {
      const del = await request.delete(`/api/vault/${created.id}`);
      expect(del.ok()).toBeTruthy();
    }
    await page.reload();
    await expect(page.getByText(title)).not.toBeVisible();
  });
});
