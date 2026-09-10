#!/usr/bin/env node

/**
 * Procucev Consulting Portal - Cloudflare Pages Deployment Pipeline
 *
 * Automates:
 * 1. Pre-flight verification (typecheck & fast differential check)
 * 2. Next.js static export build with Cloudflare Edge compatibility
 * 3. Cloudflare Pages deployment via Wrangler CLI
 * 4. Live URL summary and endpoint output
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(rootDir, 'frontend');

const projectName = process.env.CF_PAGES_PROJECT || 'procucev-consulting-portal';
const branch = process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || 'main';
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '7f01c4b0c3aa5535716bbfd16ab2886d';

console.log('🚀 [CLOUDFLARE DEPLOY] Starting Procucev Consulting Portal deployment pipeline...\n');

try {
  // Step 1: Pre-flight check
  console.log('🔍 [1/4] Running pre-flight verification...');
  execSync('node scripts/fast-check.js', { cwd: rootDir, stdio: 'inherit' });

  // Step 2: Build frontend in static export mode
  console.log('\n📦 [2/4] Building Next.js frontend in static export mode...');
  const buildEnv = {
    ...process.env,
    NEXT_OUTPUT_MODE: 'export',
    NEXT_DIST_DIR: '.next',
    NODE_OPTIONS: '--max-old-space-size=4096',
    NODE_ENV: 'production'
  };
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execSync(`${npmCmd} run build`, { cwd: frontendDir, env: buildEnv, stdio: 'inherit' });

  // Step 3: Deploy to Cloudflare Pages via Wrangler
  console.log(`\n⛅ [3/4] Uploading to Cloudflare Pages (project: ${projectName}, branch: ${branch})...`);
  const wranglerCmd = process.platform === 'win32'
    ? 'npx.cmd wrangler'
    : 'npx wrangler';
  const deployEnv = {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: accountId,
    NODE_OPTIONS: '--max-old-space-size=4096'
  };
  const deployCmd = `${wranglerCmd} pages deploy out --project-name "${projectName}" --branch "${branch}" --commit-dirty=true`;
  const deployOutput = execSync(deployCmd, {
    cwd: frontendDir,
    encoding: 'utf8',
    env: deployEnv,
    stdio: ['inherit', 'pipe', 'inherit']
  });
  console.log(deployOutput);

  // Step 4: Mandatory Post-Deployment Operations Verification
  console.log('\n🧪 [4/5] Running mandatory post-deployment operations verification (1 Backend, 1 Database, 1 File Upload)...');
  execSync('node scripts/verify-deployment-operations.js', { cwd: rootDir, stdio: 'inherit' });

  // Step 5: Verification and URL summary
  console.log('\n✅ [5/5] Cloudflare Pages deployment & operations verification completed successfully!\n');
  console.log('🌐 Deployment Endpoints:');
  console.log(`   - Production URL : https://${projectName}.pages.dev\n`);

  process.exit(0);
} catch (err) {
  console.error('\n❌ [CLOUDFLARE DEPLOY FAILED]:', err.message);
  process.exit(1);
}
