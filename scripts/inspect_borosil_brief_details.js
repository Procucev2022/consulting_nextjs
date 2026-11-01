const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/srini/.gemini/antigravity/brain/23543c96-de50-4087-bd03-cd311ab9e8ae');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1440, height: 1200 },
    args: ['--start-maximized', '--no-default-browser-check']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3001/executive-brief?assessmentId=AIC-2026-0002', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));

  // Full page screenshot of Executive Brief
  const fullShot = path.join(ARTIFACT_DIR, 'chrome_screenshot_executive_brief_full.png');
  await page.screenshot({ path: fullShot, fullPage: true });
  console.log(`Saved full Executive Brief screenshot: ${fullShot}`);

  // Scroll to slide preview & opportunities
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chrome_screenshot_executive_brief_slides.png') });

  // Scroll to structure & audit checklist
  await page.evaluate(() => window.scrollBy(0, 1000));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chrome_screenshot_executive_brief_audit.png') });

  console.log('All detailed screenshots taken.');
  browser.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
