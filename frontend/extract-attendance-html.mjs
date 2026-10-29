import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function extractHtml() {
  console.log('Capturing self-contained static HTML for /attendance?demo=staff...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:5173/attendance?demo=staff', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Evaluate and inline style definitions
  const html = await page.evaluate(() => {
    return document.documentElement.outerHTML;
  });

  const outDir = path.resolve('.stitch');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'attendance.html');
  fs.writeFileSync(outPath, '<!DOCTYPE html>\n' + html, 'utf-8');
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`✓ Successfully extracted and saved: ${outPath} (${sizeKb} KB)`);
  
  await browser.close();
}

extractHtml();
