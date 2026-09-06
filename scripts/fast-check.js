#!/usr/bin/env node
/**
 * Fast Differential Quality Check CLI
 *
 * Inspects git status to detect modified/staged files and executes fast, targeted
 * validation checks (typechecking, linting, targeted tests, schema sync) only
 * on affected workspace packages.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function runCommand(cmd, cwd = ROOT_DIR) {
  const startTime = Date.now();
  try {
    execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
    const durationMs = Date.now() - startTime;
    return { success: true, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return { success: false, durationMs, error };
  }
}

function getChangedFiles() {
  const changedFiles = new Set();

  try {
    const statusOutput = execSync('git status --porcelain', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    const lines = statusOutput.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      // Porcelain format: XY filename or XY orig -> filename
      const filePathPart = line.substring(3).trim();
      const cleanPath = filePathPart.includes('->')
        ? filePathPart.split('->')[1].trim()
        : filePathPart;
      const normalized = cleanPath.replace(/\\/g, '/');

      // Ignore output and log directories
      if (
        !normalized.startsWith('.git/') &&
        !normalized.startsWith('.next/') &&
        !normalized.startsWith('node_modules/') &&
        !normalized.startsWith('dist/') &&
        !normalized.startsWith('logs/')
      ) {
        changedFiles.add(normalized);
      }
    }
  } catch (err) {
    console.warn('[Fast Check] Warning: Unable to inspect git status:', err.message);
  }

  return Array.from(changedFiles);
}

function main() {
  const overallStart = Date.now();
  console.log('='.repeat(70));
  console.log('🚀 FAST DIFFERENTIAL QUALITY CHECK (Changed Files Only)');
  console.log('='.repeat(70));

  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('[Fast Check] Working tree is clean. No changed files detected.');
    console.log('[Fast Check] Running fast sanity typechecks across workspaces...');

    const beTypecheck = runCommand('npm --prefix backend run typecheck');
    if (!beTypecheck.success) {
      console.error('[Fast Check] ❌ Backend typecheck failed.');
      process.exit(1);
    }

    const feTypecheck = runCommand('npm --prefix frontend run typecheck');
    if (!feTypecheck.success) {
      console.error('[Fast Check] ❌ Frontend typecheck failed.');
      process.exit(1);
    }

    const totalSec = ((Date.now() - overallStart) / 1000).toFixed(2);
    console.log(`[Fast Check] ✅ All sanity checks passed in ${totalSec}s.`);
    process.exit(0);
  }

  console.log(`[Fast Check] Detected ${changedFiles.length} modified/staged file(s):`);
  changedFiles.forEach((file) => console.log(`  - ${file}`));
  console.log('-'.repeat(70));

  const backendFiles = changedFiles.filter((f) => f.startsWith('backend/'));
  const frontendFiles = changedFiles.filter((f) => f.startsWith('frontend/'));
  const prismaFiles = changedFiles.filter((f) => f.includes('prisma/schema.prisma'));
  const rootFiles = changedFiles.filter(
    (f) => !f.startsWith('backend/') && !f.startsWith('frontend/')
  );

  const BACKEND_DIR = path.resolve(ROOT_DIR, 'backend');
  const FRONTEND_DIR = path.resolve(ROOT_DIR, 'frontend');

  // 1. Database schema synchronization if Prisma schema modified
  if (prismaFiles.length > 0) {
    console.log('\n📦 Step 1: Synchronizing Database Schema...');
    const dbPush = runCommand('npm run db:push', BACKEND_DIR);
    if (!dbPush.success) {
      console.error('[Fast Check] ❌ Database schema synchronization failed.');
      process.exit(1);
    }
    console.log(`[Fast Check] ✔ Database schema synchronized (${(dbPush.durationMs / 1000).toFixed(2)}s).`);
  }

  // 2. Fast Backend Checks
  if (backendFiles.length > 0 || rootFiles.some((f) => f.includes('package.json'))) {
    console.log('\n⚙️  Step 2: Fast Backend Validations...');
    console.log('[Fast Check] Running backend typecheck...');
    const beTypecheck = runCommand('npm run typecheck', BACKEND_DIR);
    if (!beTypecheck.success) {
      console.error('[Fast Check] ❌ Backend typecheck failed.');
      process.exit(1);
    }

    console.log('[Fast Check] Running fast backend unit tests for changed files...');
    const beTests = runCommand('npm run test:fast', BACKEND_DIR);
    if (!beTests.success) {
      console.error('[Fast Check] ❌ Backend changed unit tests failed.');
      process.exit(1);
    }
    console.log(`[Fast Check] ✔ Backend checks completed (${((beTypecheck.durationMs + beTests.durationMs) / 1000).toFixed(2)}s).`);
  }

  // 3. Fast Frontend Checks
  if (frontendFiles.length > 0 || rootFiles.some((f) => f.includes('package.json'))) {
    console.log('\n🎨 Step 3: Fast Frontend Validations...');
    console.log('[Fast Check] Running frontend typecheck...');
    const feTypecheck = runCommand('npm run typecheck', FRONTEND_DIR);
    if (!feTypecheck.success) {
      console.error('[Fast Check] ❌ Frontend typecheck failed.');
      process.exit(1);
    }

    console.log('[Fast Check] Running fast frontend unit tests for changed files...');
    const feTests = runCommand('npm run test:fast', FRONTEND_DIR);
    if (!feTests.success) {
      console.error('[Fast Check] ❌ Frontend changed unit tests failed.');
      process.exit(1);
    }
    console.log(`[Fast Check] ✔ Frontend checks completed (${((feTypecheck.durationMs + feTests.durationMs) / 1000).toFixed(2)}s).`);
  }

  const totalSec = ((Date.now() - overallStart) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(70));
  console.log(`🎉 [Fast Check] All targeted differential checks passed in ${totalSec}s!`);
  console.log('='.repeat(70));
}

main();
