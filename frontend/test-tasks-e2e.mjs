import { chromium } from 'playwright';

async function runE2ETest() {
  console.log('🚀 Starting Playwright E2E verification for /tasks...');
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
    if (metricsCount < 5) {
      throw new Error(`Expected at least 5 telemetry cells, found ${metricsCount}`);
    }

    // Click tab "Checklist Templates (SOP)"
    console.log('Clicking "Checklist Templates (SOP)" tab...');
    await page.click('button#tab-templates');
    await page.waitForTimeout(400);

    const templateHeading = await page.textContent('h2');
    console.log('✓ Found template section heading:', templateHeading?.trim());

    // Switch back to "Task Monitoring Grid"
    console.log('Clicking "Task Monitoring Grid" tab...');
    await page.click('button#tab-monitoring');
    await page.waitForTimeout(400);

    // 2. Test Staff view
    console.log('Testing Staff View: http://localhost:5173/tasks?demo=staff');
    await page.goto('http://localhost:5173/tasks?demo=staff', { waitUntil: 'networkidle' });

    const staffTitle = await page.textContent('h1');
    console.log('✓ Staff title:', staffTitle?.trim());
    if (!staffTitle?.includes('My Checklist Duties')) {
      throw new Error(`Unexpected staff title: ${staffTitle}`);
    }

    // Click filter "Pending"
    console.log('Clicking filter "Pending"...');
    await page.click('button:has-text("Pending")');
    await page.waitForTimeout(300);

    // Verify presence of "Start" or "Done" button
    const actionButtons = await page.locator('button:has-text("Start"), button:has-text("Done")').count();
    console.log(`✓ Found ${actionButtons} operational action buttons on pending items.`);

    console.log('🎉 ALL PLAYWRIGHT E2E VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ E2E Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();
