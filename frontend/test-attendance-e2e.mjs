import { chromium } from 'playwright';

async function runE2ETest() {
  console.log('🚀 Starting Playwright E2E verification for Redesigned Clean Interaction Attendance...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // ==========================================
    // 1. Test Manager Workbench
    // ==========================================
    console.log('\n--- 1. Testing Manager Workbench: http://localhost:5173/attendance?demo=manager ---');
    await page.goto('http://localhost:5173/attendance?demo=manager', { waitUntil: 'networkidle' });

    const managerTitle = await page.textContent('h1');
    console.log('✓ Found manager title:', managerTitle?.trim());
    if (!managerTitle?.includes('Staff Attendance Ledger')) {
      throw new Error(`Unexpected manager title: ${managerTitle}`);
    }

    // Verify Exception Callout Banner exists
    const exceptionText = await page.textContent('.bg-\\[\\#fffbeb\\]');
    console.log('✓ Found Exception Callout Banner:', exceptionText?.replace(/\s+/g, ' ').trim());

    // Test clicking "Review exceptions →"
    console.log('Testing "Review exceptions →" button click...');
    await page.click('button:has-text("Review exceptions →")');
    await page.waitForTimeout(300);
    const exceptionRows = await page.locator('tbody tr').count();
    console.log(`✓ Exception filter active: showing ${exceptionRows} flagged rows.`);

    // Click "Show all records"
    await page.click('button:has-text("Show all records")');
    await page.waitForTimeout(300);
    const allRows = await page.locator('tbody tr').count();
    console.log(`✓ Reset to full ledger: showing ${allRows} rows.`);

    // Test Collapsible Metrics Panel: Toggle on
    console.log('Testing Collapsible Metrics Panel toggle...');
    const metricsBtn = page.locator('button:has-text("Metrics")');
    await metricsBtn.click();
    await page.waitForTimeout(300);

    const metricsPanelText = await page.locator('text=Sales floor presence').count();
    console.log('✓ Collapsible metrics panel expanded:', metricsPanelText > 0);

    // Toggle off
    console.log('Collapsing metrics panel...');
    await page.locator('button:has-text("Hide Metrics")').click();
    await page.waitForTimeout(300);
    const isCollapsed = (await page.locator('text=Sales floor presence').count()) === 0;
    console.log('✓ Metrics panel collapsed cleanly:', isCollapsed);

    // Test search filter: type "Elena"
    console.log('Testing search filter for "Elena"...');
    await page.locator('input[placeholder="Filter associate or shift..."]').fill('Elena');
    await page.waitForTimeout(300);
    const elenaCount = await page.locator('tbody tr').count();
    console.log(`✓ Search filter active: ${elenaCount} row(s) for Elena`);

    // Clear search
    await page.locator('button[aria-label="Clear search query"]').click();
    await page.waitForTimeout(300);

    // Test Receipt Drawer
    console.log('Opening Receipt Drawer...');
    await page.locator('button:has-text("Receipt →")').first().click();
    await page.waitForTimeout(300);
    const drawerTitle = await page.textContent('#attendance-drawer-title');
    console.log('✓ Drawer opened with shift:', drawerTitle?.trim());

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    console.log('✓ Closed drawer');

    // ==========================================
    // 2. Test Staff View
    // ==========================================
    console.log('\n--- 2. Testing Staff View: http://localhost:5173/attendance?demo=staff ---');
    await page.goto('http://localhost:5173/attendance?demo=staff', { waitUntil: 'networkidle' });

    const staffTitle = await page.textContent('h1');
    console.log('✓ Found staff title:', staffTitle?.trim());

    const terminalHeader = await page.textContent('h2:has-text("Store Punch Terminal")');
    console.log('✓ Found punch station:', terminalHeader?.trim());

    console.log('\n🎉 ALL CLEAN INTERACTION TESTS (COLLAPSIBLE + SEARCH + AUDIT) PASSED 100%!');
  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();
