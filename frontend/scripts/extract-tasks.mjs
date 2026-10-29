import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function extractTasksHtml() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:5173/tasks?demo=manager', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Extract full page HTML
  const content = await page.content();
  const targetPath = path.resolve('../.stitch/tasks.html');
  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log(`✓ Successfully saved ${targetPath} (${(content.length / 1024).toFixed(1)} KB)`);

  await browser.close();
}

extractTasksHtml().catch(console.error);
