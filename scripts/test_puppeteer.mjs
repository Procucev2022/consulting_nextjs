import puppeteer from 'puppeteer-core';

async function main() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:3001/login...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0', timeout: 30000 });
  const title = await page.title();
  console.log('Page Title:', title);

  await browser.close();
  console.log('Browser closed successfully.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
