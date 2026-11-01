const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/srini/.gemini/antigravity/brain/23543c96-de50-4087-bd03-cd311ab9e8ae');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('[Screen Inspection] Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1440, height: 950 },
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
      console.error(`[Console ERROR] ${text}`);
      consoleErrors.push(text);
    } else if (type === 'warn') {
      console.warn(`[Console WARN] ${text}`);
    } else {
      console.log(`[Console ${type.toUpperCase()}] ${text}`);
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('favicon.ico')) {
      console.error(`[Network ERROR] ${status} on ${url}`);
      networkErrors.push({ status, url });
    }
  });

  // Prime origin and set authentication in localStorage
  console.log('[Screen Inspection] Priming localStorage session...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('procucev_auth_token', 'dev-temp-token-borosil');
    localStorage.setItem('procucev_current_user', JSON.stringify({
      id: 'USER-BOROSIL-001',
      email: 'buyer@borosil.com',
      name: 'Borosil Procurement Team',
      company_name: 'Borosil Ltd',
      role: 'USER',
      subscription_tier: 'GOLD',
      status: 'ACTIVE'
    }));
    localStorage.setItem('aicev_selected_assessment_id', 'AIC-2026-0002');
    localStorage.setItem('procucev_simulated_tier', 'GOLD');
  });

  // 1. Module 1: Baseline and spend analysis
  console.log('[Screen Inspection] Screen 1: Module 1 Baseline & Spend Analysis...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module1', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  const shotMod1 = path.join(ARTIFACT_DIR, 'screen1_module1_spend_baseline.png');
  await page.screenshot({ path: shotMod1, fullPage: false });
  console.log(`Saved Screen 1: ${shotMod1}`);

  // 2. Module 2: Qualified opportunity and lever summaries
  console.log('[Screen Inspection] Screen 2: Module 2 Qualified Opportunity & Lever Summaries...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module2', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  const shotMod2 = path.join(ARTIFACT_DIR, 'screen2_module2_strategic_sourcing.png');
  await page.screenshot({ path: shotMod2, fullPage: false });
  console.log(`Saved Screen 2: ${shotMod2}`);

  // 3. Module 3: Closed benchmark status and zero benchmark contribution
  console.log('[Screen Inspection] Screen 3: Module 3 Closed Benchmark Status...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module3', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  const shotMod3 = path.join(ARTIFACT_DIR, 'screen3_module3_pcbi_benchmark.png');
  await page.screenshot({ path: shotMod3, fullPage: false });
  console.log(`Saved Screen 3: ${shotMod3}`);

  // 4. Module 4: Savings waterfall and governance status
  console.log('[Screen Inspection] Screen 4: Module 4 Savings Waterfall & Governance...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module4', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  const shotMod4 = path.join(ARTIFACT_DIR, 'screen4_module4_savings_realization.png');
  await page.screenshot({ path: shotMod4, fullPage: false });
  console.log(`Saved Screen 4: ${shotMod4}`);

  // 5. Executive Management Report
  console.log('[Screen Inspection] Screen 5: Executive Management Report...');
  await page.goto('http://localhost:3001/executive-brief?assessmentId=AIC-2026-0002', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  const shotBrief = path.join(ARTIFACT_DIR, 'screen5_executive_management_report.png');
  await page.screenshot({ path: shotBrief, fullPage: false });
  console.log(`Saved Screen 5: ${shotBrief}`);

  console.log('\n======================================================');
  console.log('BROWSER INSPECTION AUDIT RESULTS:');
  console.log(`Console Errors: ${consoleErrors.length}`);
  consoleErrors.forEach((e, idx) => console.log(`  [${idx + 1}] ${e}`));
  console.log(`Network Failed Requests: ${networkErrors.length}`);
  networkErrors.forEach((e, idx) => console.log(`  [${idx + 1}] ${e.status} ${e.url}`));
  console.log('======================================================');
  console.log('Google Chrome remains running locally on http://localhost:3001.');

  browser.disconnect();
}

main().catch((err) => {
  console.error('[Browser Inspection Error]', err);
  process.exit(1);
});
