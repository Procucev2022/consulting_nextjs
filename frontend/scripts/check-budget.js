#!/usr/bin/env node
/**
 * Frontend Performance Budget Check CLI
 *
 * Enforces performance budgets for client-side JavaScript bundles and critical CSS.
 * Exits with code 1 if budgets are exceeded, failing the quality check pipeline.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Performance budget limits (in KB)
const BUDGET_LIMITS = {
  MAX_JS_BUNDLE_KB: 250,      // Max shared client JS bundle (gzip)
  MAX_CRITICAL_CSS_KB: 50,     // Max critical CSS (gzip)
  MAX_SHARED_JS_CHUNK_KB: 120, // Max individual shared JS chunk (gzip)
  MAX_TOTAL_PAGE_JS_KB: 320    // Max total primary route JS (gzip)
};

function calculateGzipSize(buffer) {
  return zlib.gzipSync(buffer).length;
}

function inspectFile(filePath, baseDir) {
  const fullPath = path.resolve(baseDir, filePath);
  if (!fs.existsSync(fullPath)) return null;
  const content = fs.readFileSync(fullPath);
  const rawBytes = content.length;
  const gzipBytes = calculateGzipSize(content);
  return {
    filePath,
    rawBytes,
    gzipBytes,
    rawKb: Number((rawBytes / 1024).toFixed(2)),
    gzipKb: Number((gzipBytes / 1024).toFixed(2))
  };
}

function runBudgetCheck() {
  const baseDir = path.resolve(__dirname, '..');
  const manifestPath = path.resolve(baseDir, '.next/app-build-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('\n❌ Error: Production build manifest (.next/app-build-manifest.json) not found.');
    console.error('Please execute `npm run build` prior to running performance budget checks.\n');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const violations = [];
  const assetMetrics = [];

  let totalSharedJsGzipBytes = 0;
  let criticalCssGzipBytes = 0;
  let totalPageJsGzipBytes = 0;

  // 1. Critical CSS
  const layoutFiles = manifest.pages?.['/layout'] || [];
  let cssFiles = layoutFiles.filter((f) => f.endsWith('.css'));

  if (cssFiles.length === 0) {
    const cssDir = path.resolve(baseDir, '.next/static/css');
    if (fs.existsSync(cssDir)) {
      const dirFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
      cssFiles = dirFiles.map((f) => `static/css/${f}`);
    }
  }

  for (const cssFile of cssFiles) {
    const metric = inspectFile(path.join('.next', cssFile), baseDir);
    if (metric) {
      criticalCssGzipBytes += metric.gzipBytes;
      assetMetrics.push(metric);
    }
  }

  const criticalCssGzipKb = Number((criticalCssGzipBytes / 1024).toFixed(2));
  if (criticalCssGzipKb > BUDGET_LIMITS.MAX_CRITICAL_CSS_KB) {
    violations.push(
      `Critical CSS budget exceeded: ${criticalCssGzipKb} KB (Budget: ${BUDGET_LIMITS.MAX_CRITICAL_CSS_KB} KB)`
    );
  }

  // 2. Shared Client JS
  const notFoundFiles = manifest.pages?.['/_not-found/page'] || [];
  const sharedJsFiles = notFoundFiles.filter((f) => f.endsWith('.js') && !f.includes('_not-found'));

  for (const jsFile of sharedJsFiles) {
    const metric = inspectFile(path.join('.next', jsFile), baseDir);
    if (metric) {
      totalSharedJsGzipBytes += metric.gzipBytes;
      assetMetrics.push(metric);
      if (metric.gzipKb > BUDGET_LIMITS.MAX_SHARED_JS_CHUNK_KB) {
        violations.push(
          `Shared chunk ${jsFile} exceeded limit: ${metric.gzipKb} KB (Budget: ${BUDGET_LIMITS.MAX_SHARED_JS_CHUNK_KB} KB)`
        );
      }
    }
  }

  const totalSharedJsGzipKb = Number((totalSharedJsGzipBytes / 1024).toFixed(2));
  if (totalSharedJsGzipKb > BUDGET_LIMITS.MAX_JS_BUNDLE_KB) {
    violations.push(
      `Shared Client JS bundle exceeded budget: ${totalSharedJsGzipKb} KB (Budget: ${BUDGET_LIMITS.MAX_JS_BUNDLE_KB} KB)`
    );
  }

  // 3. Total Page JS (/page)
  const pageFiles = manifest.pages?.['/page'] || [];
  const pageJsFiles = pageFiles.filter((f) => f.endsWith('.js'));

  for (const jsFile of pageJsFiles) {
    const metric = inspectFile(path.join('.next', jsFile), baseDir);
    if (metric) {
      totalPageJsGzipBytes += metric.gzipBytes;
      if (!assetMetrics.some((m) => m.filePath === metric.filePath)) {
        assetMetrics.push(metric);
      }
    }
  }

  const totalPageJsGzipKb = Number((totalPageJsGzipBytes / 1024).toFixed(2));
  if (totalPageJsGzipKb > BUDGET_LIMITS.MAX_TOTAL_PAGE_JS_KB) {
    violations.push(
      `Total primary route JS exceeded budget: ${totalPageJsGzipKb} KB (Budget: ${BUDGET_LIMITS.MAX_TOTAL_PAGE_JS_KB} KB)`
    );
  }

  // Output Report
  console.log('\n======================================================');
  console.log('       CLIENT-SIDE PERFORMANCE BUDGET REPORT          ');
  console.log('======================================================');
  console.log(`Shared Client JS (gzip): ${totalSharedJsGzipKb.toFixed(2)} KB / ${BUDGET_LIMITS.MAX_JS_BUNDLE_KB} KB limit`);
  console.log(`Critical CSS (gzip):     ${criticalCssGzipKb.toFixed(2)} KB / ${BUDGET_LIMITS.MAX_CRITICAL_CSS_KB} KB limit`);
  console.log(`Total Page JS (gzip):    ${totalPageJsGzipKb.toFixed(2)} KB / ${BUDGET_LIMITS.MAX_TOTAL_PAGE_JS_KB} KB limit`);
  console.log('------------------------------------------------------');
  console.log('Asset Breakdown:');
  assetMetrics.forEach((asset) => {
    console.log(`  - ${asset.filePath.padEnd(50)}: ${asset.gzipKb.toFixed(2).padStart(7)} KB (gzip) [${asset.rawKb.toFixed(2).padStart(7)} KB raw]`);
  });
  console.log('------------------------------------------------------');

  if (violations.length > 0) {
    console.error('❌ PERFORMANCE BUDGET VIOLATION(S):');
    violations.forEach((v) => console.error(`   [FAIL] ${v}`));
    console.log('======================================================\n');
    process.exit(1);
  } else {
    console.log('✔ All client-side assets satisfy strict performance budgets!');
    console.log('======================================================\n');
    process.exit(0);
  }
}

runBudgetCheck();
