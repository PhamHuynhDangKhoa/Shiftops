import { chromium } from 'playwright';

async function runHandoversE2ETest() {
  console.log('🚀 Starting Playwright E2E verification for Redesigned Split-View Handover Workbench...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // 1. Navigate to Handovers Page
    console.log('Step 1: Navigating to /handovers?demo=manager...');
    await page.goto('http://localhost:5173/handovers?demo=manager', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.locator('h1').textContent();
    console.log('✓ Page Header Title:', title);
    if (!title?.includes('Shift Handover & Turnover')) {
      throw new Error(`Expected title to include "Shift Handover & Turnover", got "${title}"`);
    }

    // 2. Verify Split-View Workbench Layout
    console.log('Step 2: Checking Split-View Layout (Active Dossier + Audit Rail)...');
    const checklistCompletion = await page.locator('text=Checklist completion').first();
    await checklistCompletion.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Left: Checklist completion metric cell visible');

    const cashFloat = await page.locator('text=Register cash float').first();
    await cashFloat.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Left: Cash float reconciliation cell visible (¥45,000)');

    const dualSignOff = await page.locator('text=Dual sign-off accountability').first();
    await dualSignOff.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Right Rail: Dual sign-off accountability panel visible');

    const outgoingPanel = await page.locator('text=Outgoing shifts to debrief').first();
    await outgoingPanel.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Right Rail: Outgoing shifts to debrief panel visible');

    // 3. Test Filter: "Needs Attention" & "All"
    console.log('Step 3: Testing Quiet Item Filter...');
    const attentionBtn = page.locator('button:has-text("Needs Attention")').first();
    await attentionBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ Clicked "Needs Attention"');

    const allBtn = page.locator('button:has-text("All (5)")').first();
    await allBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ Restored "All (5)"');

    // 4. Test View Dossier Modal
    console.log('Step 4: Testing Full Dossier Modal...');
    const fullDossierBtn = page.locator('button:has-text("Full Dossier")').first();
    await fullDossierBtn.click();
    await page.waitForTimeout(500);

    const dossierModalTitle = await page.locator('text=Shift Handover Dossier & Audit').first();
    await dossierModalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Full Dossier inspection modal opened');

    const closeBtn = page.locator('button:has-text("Close")').first();
    await closeBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ Full Dossier modal closed');

    // 5. Test 30-day History Archive Collapsible
    console.log('Step 5: Testing Progressive Disclosure Collapsible Archive...');
    const archiveToggle = page.locator('button:has-text("View full 30-day historical turnover archive")').first();
    await archiveToggle.click();
    await page.waitForTimeout(500);

    const archiveTable = page.locator('text=Handover History & Audit Archive').first();
    await archiveTable.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Expanded 30-day historical turnover audit table');

    const hideArchiveToggle = page.locator('button:has-text("Hide 30-day historical turnover archive")').first();
    await hideArchiveToggle.click();
    await page.waitForTimeout(300);
    console.log('✓ Collapsed 30-day archive');

    // 6. Test Handover Sign-Off Flow
    console.log('Step 6: Testing Handover Sign-Off Flow...');
    const signBtn = page.locator('button:has-text("Sign Turnover")').first();
    await signBtn.click();
    await page.waitForTimeout(500);

    const ackModalTitle = await page.locator('text=Acknowledge Shift Turnover').first();
    await ackModalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Acknowledge turnover modal opened');

    // Fill in sign-off notes
    const ackTextarea = page.locator('textarea[placeholder*="till counts" i], textarea[placeholder*="Till counts" i]').first();
    await ackTextarea.fill('Verified register cash float at ¥45,000. Reconciled midday deposit.');
    console.log('✓ Filled in supervisor sign-off confirmation');

    // Click confirm
    const confirmBtn = page.locator('button:has-text("Confirm & Sign Turnover")').first();
    await confirmBtn.click();
    await page.waitForTimeout(1000);

    // Verify success banner and transition to ACKNOWLEDGED
    const successBanner = page.locator('text=Shift turnover acknowledged').first();
    await successBanner.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Success banner displayed:', await successBanner.textContent());

    const signedBadge = page.locator('text=Store responsibility formally accepted').first();
    await signedBadge.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Supervisor formal store acceptance verification rendered');

    // Screenshot for verification
    await page.screenshot({ path: '.taste-skill/inspect/handovers-splitview-acknowledged-e2e.png', fullPage: true });
    console.log('✓ Captured E2E screenshot to .taste-skill/inspect/handovers-splitview-acknowledged-e2e.png');

    console.log('\n🎉 ALL SPLIT-VIEW HANDOVER E2E TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    await page.screenshot({ path: '.taste-skill/inspect/handovers-e2e-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runHandoversE2ETest();
