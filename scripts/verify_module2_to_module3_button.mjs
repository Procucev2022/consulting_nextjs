import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3001';
const ARTIFACT_DIR = 'C:\\Users\\srini\\.gemini\\antigravity-ide\\brain\\4a3e26bc-2f19-4999-85df-0757d158192a';

async function main() {
  console.log('Launching headless Chrome for Module 2 -> Module 3 Navigation Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1600, height: 1200 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Navigate to login
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

  const analystUser = {
    id: 'usr-analyst-001',
    name: 'Procurement Analyst',
    email: 'analyst@procucev.com',
    role: 'USER',
    company_name: 'Borosil Ltd',
    subscription_tier: 'PLATINUM',
    created_at: new Date().toISOString()
  };

  await page.evaluate((user) => {
    localStorage.setItem('procucev_auth_token', 'jwt-analyst-token-verified-session-2026');
    localStorage.setItem('procucev_current_user', JSON.stringify(user));
    localStorage.setItem('procucev_simulated_tier', 'PLATINUM');
    localStorage.setItem('aicev_selected_assessment_id', 'AIC-2026-0002');
  }, analystUser);

  // Navigate to Module 2
  console.log('Navigating to Module 2 (http://localhost:3001/#module2)...');
  await page.goto(`${APP_URL}/#module2`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4000));

  // Find the button and check its text
  const buttonInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map((b) => ({
      text: b.innerText.trim(),
      classes: b.className
    }));
    const match = buttons.find((b) => b.text.includes('Proceed to PCBI Benchmark Coverage & Gap Analysis'));
    return {
      found: !!match,
      buttonText: match ? match.text : null,
      allButtons: buttons.map((b) => b.text).slice(0, 20)
    };
  });

  console.log('Module 2 Button Info:', JSON.stringify(buttonInfo, null, 2));

  // Scroll button into view and take screenshot of Module 2
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText.includes('Proceed to PCBI Benchmark Coverage & Gap Analysis'));
    if (btn) {
      btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await new Promise((r) => setTimeout(r, 1000));

  const screenshotModule2Path = path.join(ARTIFACT_DIR, 'borosil_module2_completion_button.png');
  await page.screenshot({ path: screenshotModule2Path, fullPage: false });
  console.log(`Saved screenshot: ${screenshotModule2Path}`);

  // Click the button
  console.log('Clicking "Proceed to PCBI Benchmark Coverage & Gap Analysis →"...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText.includes('Proceed to PCBI Benchmark Coverage & Gap Analysis'));
    if (btn) {
      btn.click();
    }
  });

  // Wait for transition to Module 3
  await new Promise((r) => setTimeout(r, 4000));

  // Check state of Module 3 after click
  const module3State = await page.evaluate(() => {
    const currentHash = window.location.hash;
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map((h) => h.innerText.trim()).filter(Boolean);
    const bodyText = document.body.innerText;
    const hasBaseline = bodyText.includes('556.53') || bodyText.includes('₹556.53');
    const hasTransactions = bodyText.includes('27,777');
    const hasGapView = bodyText.includes('Status-Wise Count & Spend Reconciliation') || bodyText.includes('Missing-Index Gap List');

    return {
      currentHash,
      headings,
      hasBaseline,
      hasTransactions,
      hasGapView
    };
  });

  console.log('Module 3 State after click:', JSON.stringify(module3State, null, 2));

  // Capture screenshot of Module 3 after navigation
  const screenshotModule3Path = path.join(ARTIFACT_DIR, 'borosil_module3_navigated_from_button.png');
  await page.screenshot({ path: screenshotModule3Path, fullPage: false });
  console.log(`Saved screenshot: ${screenshotModule3Path}`);

  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
