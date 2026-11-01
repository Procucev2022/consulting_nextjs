const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/srini/.gemini/antigravity/brain/23543c96-de50-4087-bd03-cd311ab9e8ae');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('[Chrome Audit] Connecting/launching Chrome with auth...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--start-maximized', '--no-default-browser-check']
  });

  const page = await browser.newPage();
  
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  // Click on "Sriman (Admin)" button if present
  console.log('[Chrome Audit] Looking for quick login button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.innerText.includes('Sriman (Admin)'));
    if (adminBtn) adminBtn.click();
  });
  await new Promise((r) => setTimeout(r, 3000));

  // Now navigate to Module 1
  console.log('[Chrome Audit] Capturing Module 1 after login...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module1', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chrome_screenshot_module1_auth.png') });

  // Module 2
  console.log('[Chrome Audit] Capturing Module 2 after login...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module2', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chrome_screenshot_module2_auth.png') });

  // Module 3
  console.log('[Chrome Audit] Capturing Module 3 after login...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module3', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chrome_screenshot_module3_auth.png') });

  // Module 4
  console.log('[Chrome Audit] Capturing Module 4 after login...');
  await page.goto('http://localhost:3001/?assessmentId=AIC-2026-0002&tab=module4', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chrome_screenshot_module4_auth.png') });

  console.log('[Chrome Audit] All authenticated module screenshots captured successfully.');
  browser.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
