const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/srini/.gemini/antigravity/brain/23543c96-de50-4087-bd03-cd311ab9e8ae');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('[Chrome Audit] Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: [
      '--start-maximized',
      '--no-default-browser-check',
      '--disable-extensions'
    ]
  });

  const page = await browser.newPage();
  
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      console.error(`[Browser Console ERROR] ${text}`);
      consoleErrors.push(text);
    } else if (type === 'warn') {
      console.warn(`[Browser Console WARN] ${text}`);
    } else {
      console.log(`[Browser Console ${type.toUpperCase()}] ${text}`);
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('favicon.ico')) {
      console.error(`[Network ERROR] ${status} on ${url}`);
      networkErrors.push({ url, status });
    }
  });

  // Module 1
  console.log('[Chrome Audit] Navigating to Module 1 (Diagnostic Spend Baseline)...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module1', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  const shot1 = path.join(ARTIFACT_DIR, 'chrome_screenshot_module1.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log(`[Chrome Audit] Saved Module 1 screenshot: ${shot1}`);

  // Module 2
  console.log('[Chrome Audit] Navigating to Module 2 (Strategic Sourcing Opportunities)...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module2', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  const shot2 = path.join(ARTIFACT_DIR, 'chrome_screenshot_module2.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log(`[Chrome Audit] Saved Module 2 screenshot: ${shot2}`);

  // Module 3
  console.log('[Chrome Audit] Navigating to Module 3 (PCBI Benchmark & Price Trends)...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module3', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  const shot3 = path.join(ARTIFACT_DIR, 'chrome_screenshot_module3.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log(`[Chrome Audit] Saved Module 3 screenshot: ${shot3}`);

  // Module 4
  console.log('[Chrome Audit] Navigating to Module 4 (Savings Realization Engine)...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module4', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  const shot4 = path.join(ARTIFACT_DIR, 'chrome_screenshot_module4.png');
  await page.screenshot({ path: shot4, fullPage: false });
  console.log(`[Chrome Audit] Saved Module 4 screenshot: ${shot4}`);

  // Executive Opportunity Brief
  console.log('[Chrome Audit] Navigating to Executive Opportunity Brief presentation...');
  await page.goto('http://localhost:3001/executive-brief?assessmentId=AIC-2026-0002', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  const shotBrief = path.join(ARTIFACT_DIR, 'chrome_screenshot_executive_brief.png');
  await page.screenshot({ path: shotBrief, fullPage: false });
  console.log(`[Chrome Audit] Saved Executive Brief screenshot: ${shotBrief}`);

  console.log('\n======================================================');
  console.log('CHROME AUDIT SUMMARY:');
  console.log(`Console Errors: ${consoleErrors.length}`);
  consoleErrors.forEach((e, idx) => console.log(`  [${idx + 1}] ${e}`));
  console.log(`Network Errors: ${networkErrors.length}`);
  networkErrors.forEach((e, idx) => console.log(`  [${idx + 1}] ${e.status} ${e.url}`));
  console.log('======================================================');
  console.log('NOTE: Google Chrome will remain open and running on localhost:3001 for user inspection.');

  browser.disconnect();
}

main().catch((err) => {
  console.error('[Chrome Audit Fatal Error]', err);
  process.exit(1);
});
