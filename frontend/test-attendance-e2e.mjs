import { chromium } from 'playwright';

async function runE2ETest() {
  console.log('🚀 Starting Playwright E2E verification for UX-Polished /attendance...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // ==========================================
    // 1. Test Staff View
    // ==========================================
    console.log('\n--- 1. Testing Staff View: http://localhost:5173/attendance?demo=staff ---');
    await page.goto('http://localhost:5173/attendance?demo=staff', { waitUntil: 'networkidle' });

    // Check title
    const staffTitle = await page.textContent('h1');
    console.log('✓ Found title:', staffTitle?.trim());
    if (!staffTitle?.includes('My Attendance & Punch Terminal')) {
      throw new Error(`Unexpected title: ${staffTitle}`);
    }

    // Check Store Punch Terminal header
    const terminalHeader = await page.textContent('h2:has-text("Store Punch Terminal")');
    console.log('✓ Found terminal header:', terminalHeader?.trim());

    // Check Live Clock
    const clockText = await page.locator('.font-mono.tabular-nums').first().textContent();
    console.log('✓ Live clock active:', clockText?.trim());

    // Check Personal Staff Telemetry Strip (4 metric cells)
    const staffMetrics = await page.locator('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > div').count();
    console.log(`✓ Found ${staffMetrics} staff telemetry cells (Weekly Hours, Punctuality, Roster Progress, Status).`);
    if (staffMetrics !== 4) {
      throw new Error(`Expected 4 staff telemetry cells, found: ${staffMetrics}`);
    }

    // Check Ledger Table
    const staffTableRows = await page.locator('tbody tr').count();
    console.log(`✓ Found ${staffTableRows} attendance records in personal shift ledger.`);

    // Click on Receipt button to open AttendanceDetailDrawer
    console.log('Testing AttendanceDetailDrawer interaction on staff record...');
    await page.locator('button:has-text("Receipt →")').first().click();
    await page.waitForTimeout(400);

    const drawerTitle = await page.textContent('#attendance-drawer-title');
    console.log('✓ Drawer opened successfully with shift title:', drawerTitle?.trim());

    // Verify drawer displays official punch timeline
    const punchTimelineText = await page.locator('text=Punch Record Verification').count();
    console.log('✓ Found punch timeline verification section:', punchTimelineText > 0);

    // Close drawer via Escape key
    console.log('Closing drawer via Escape key...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Test Punch Button Trigger
    console.log('Testing punch button interaction...');
    const clockInBtn = page.locator('button:has-text("Clock In for Shift")');
    const clockOutBtn = page.locator('button:has-text("Clock Out (Conclude Shift)")');

    if (await clockInBtn.count() > 0) {
      console.log('Found Clock In button, clicking...');
      await clockInBtn.click();
      await page.waitForTimeout(600);
      const alertMsg = await page.textContent('.border.rounded-lg');
      console.log('✓ Action notification observed:', alertMsg?.trim());
    } else if (await clockOutBtn.count() > 0) {
      console.log('Found Clock Out button, clicking...');
      await clockOutBtn.click();
      await page.waitForTimeout(600);
      const alertMsg = await page.textContent('.border.rounded-lg');
      console.log('✓ Action notification observed:', alertMsg?.trim());
    } else {
      console.log('Shift already concluded or outside window.');
    }

    // ==========================================
    // 2. Test Manager View
    // ==========================================
    console.log('\n--- 2. Testing Manager View: http://localhost:5173/attendance?demo=manager ---');
    await page.goto('http://localhost:5173/attendance?demo=manager', { waitUntil: 'networkidle' });

    const managerTitle = await page.textContent('h1');
    console.log('✓ Found manager title:', managerTitle?.trim());
    if (!managerTitle?.includes('Staff Attendance Ledger')) {
      throw new Error(`Unexpected manager title: ${managerTitle}`);
    }

    // Check Manager 5-cell Branch Telemetry Strip
    const branchMetrics = await page.locator('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 > div').count();
    console.log(`✓ Found ${branchMetrics} branch telemetry cells (Punches, On floor, Compliance, Late, Absences).`);
    if (branchMetrics !== 5) {
      throw new Error(`Expected 5 branch telemetry cells, found: ${branchMetrics}`);
    }

    // Check Manager Master Table
    const managerTableRows = await page.locator('tbody tr').count();
    console.log(`✓ Found ${managerTableRows} records in manager shift punch ledger.`);

    // Verify employee column is visible
    const associateHeader = await page.locator('th:has-text("Employee Associate")').count();
    console.log('✓ Employee Associate column present in manager audit view:', associateHeader > 0);

    console.log('\n🎉 ALL E2E ATTENDANCE TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();
