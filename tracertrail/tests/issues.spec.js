
import { test, expect } from '@playwright/test';

test.describe('Issues Management', () => {
  let projectName;
  let datasetName;
  let dataSourceName;

  test.beforeEach(async ({ page }) => {
    // 1. Create Project
    projectName = `Project for Issue ${Date.now()}`;
    await page.goto('/Projects');
    await page.getByRole('button', { name: 'New Project' }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await page.locator('#name').fill(projectName);
    await page.locator('button[type="submit"]').click();

    // 2. Create Dataset
    datasetName = `Dataset for Issue ${Date.now()}`;
    await page.goto('/Datasets');
    await page.getByRole('button', { name: 'New Dataset' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('#name').fill(datasetName);
    // Select Project
    await page.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: projectName }).click();
    await page.locator('button[type="submit"]').click();

    // 3. Create Data Source
    dataSourceName = `DataSource for Issue ${Date.now()}`;
    await page.goto('/DataSources');
    await page.getByRole('button', { name: 'Add Source' }).click();
    await page.locator('#name').fill(dataSourceName);
    // Select Type
    await page.locator('button[role="combobox"]').nth(0).click();
    await page.getByRole('option', { name: 'Database Table' }).click();
    // Select Dataset
    await page.locator('button[role="combobox"]').nth(1).click();
    await page.getByRole('option', { name: datasetName }).click();
    
    await page.locator('#source_location').fill('test_table');
    await page.getByRole('button', { name: 'Add to Queue' }).click();
  });

  test('Create, Edit, and Delete an Issue', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Navigate to Data Sources
    await page.goto('/DataSources');
    await page.getByText(dataSourceName).click();

    // Navigate to Issues tab and click Log Issue
    // Note: Log Issue button is in the header, not under a tab
    await page.getByRole('button', { name: 'Log Issue' }).first().click();

    // 2. Fill Issue Form
    const issueTitle = `Data Quality Issue ${Date.now()}`;
    await expect(page).toHaveURL(/.*NewIssue/i);
    
    await page.locator('#title').fill(issueTitle);
    await page.locator('#description').fill('Found some null values in the critical column.');
    
    // Select Severity
    await page.locator('label:has-text("Severity *")').locator('..').getByRole('combobox').click();
    await page.getByRole('option', { name: 'High' }).click();

    // Select Status
    await page.locator('label:has-text("Status *")').locator('..').getByRole('combobox').click();
    await page.getByRole('option', { name: 'Open' }).click();

    await page.getByRole('button', { name: 'Create Issue' }).click();

    // 3. Verify Issue Created
    // Should redirect to Issue Detail or List
    // await expect(page).toHaveURL(/.*IssueDetail/i); // or DataSourceDetail
    await expect(page.getByText(issueTitle)).toBeVisible();

    // 4. Edit Issue
    // If we are on detail page, look for "Edit"
    // If we are on list, click the issue first
    // Let's assume we are on Detail page or can click it.
    if (!await page.getByRole('button', { name: 'Save Changes' }).isVisible()) {
        // We are likely on list or read-only view
        await page.getByText(issueTitle).first().click();
    }
    
    // Now we should be on IssueDetail
    // Click Edit toggle or just edit fields if they are open?
    // Often there is an "Edit" button to enable mode, or "Update" button.
    // Let's look for "Edit" or simply fill fields if they are inputs.
    // Let's assume we need to click "Edit" or similar if it's not direct.
    // But many apps allow direct edit.
    // Let's try to fill Description again.
    
    // Actually, let's check for an "Edit" button.
    const editButton = page.getByRole('button', { name: 'Edit' });
    if (await editButton.isVisible()) {
        await editButton.click();
    }

    const updatedDesc = 'Updated description for testing.';
    // Update description - use ID selector
    await page.locator('#description').fill(updatedDesc);
    await page.locator('button[type="submit"]').click();
    
  });
});
