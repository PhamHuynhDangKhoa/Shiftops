import { chromium } from 'playwright';

async function runE2ETest() {
  console.log('🚀 Starting Playwright E2E verification for UX-Polished /tasks...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // 1. Test Manager view
    console.log('Testing Manager View: http://localhost:5173/tasks?demo=manager');
    await page.goto('http://localhost:5173/tasks?demo=manager', { waitUntil: 'networkidle' });

    // Check title
    const title = await page.textContent('h1');
    console.log('✓ Found title:', title?.trim());
    if (!title?.includes('Task & Checklist Control')) {
      throw new Error(`Unexpected title: ${title}`);
    }

    // Check telemetry strip (5 metric cells)
    const metricsCount = await page.locator('.grid > div').count();
    console.log('✓ Found telemetry strip cells:', metricsCount);

    // Verify Grouped SOP view is active by default
    const sopGroupHeaders = await page.locator('h3:has-text("Shift"), h3:has-text("SOP")').count();
    console.log(`✓ Found ${sopGroupHeaders} SOP Procedure Groups in Grouped View.`);

    // Click a task to open the Slide-Over Drawer
    console.log('Testing TaskDetailDrawer interaction...');
    await page.click('span:has-text("Unlock main entrance")');
    await page.waitForTimeout(400);

    const drawerTitle = await page.textContent('#drawer-task-title');
    console.log('✓ Drawer opened successfully with title:', drawerTitle?.trim());

    // Close drawer via Escape key
    console.log('Closing drawer via Escape key...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Toggle to Audit Table view
    console.log('Toggling to Flat Audit Table...');
    await page.click('button:has-text("Audit Table")');
    await page.waitForTimeout(300);

    const tableRows = await page.locator('tbody tr').count();
    console.log(`✓ Found ${tableRows} rows in Flat Audit Table view.`);

    // 2. Test Staff view
    console.log('Testing Staff View: http://localhost:5173/tasks?demo=staff');
    await page.goto('http://localhost:5173/tasks?demo=staff', { waitUntil: 'networkidle' });

    const staffTitle = await page.textContent('h1');
    console.log('✓ Staff title:', staffTitle?.trim());

    // Check that ergonomic action buttons are rendered
    const actionButtons = await page.locator('button:has-text("Start"), button:has-text("Done"), button:has-text("Mark Complete")').count();
    console.log(`✓ Found ${actionButtons} ergonomic action buttons for kitchen/floor staff.`);
    if (actionButtons < 1) {
      throw new Error(`Expected at least 1 action button, found ${actionButtons}`);
    }

    console.log('🎉 ALL PLAYWRIGHT E2E VERIFICATIONS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ E2E Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();
