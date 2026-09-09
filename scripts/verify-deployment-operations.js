#!/usr/bin/env node

/**
 * Mandatory Deployment Verification Runner
 *
 * Executes and verifies:
 * 1. At least one Backend-related operation (API route/healthcheck verification)
 * 2. At least one Database-related operation (ORM/Datastore query & audit verification)
 * 3. At least one File-uploading operation (Multi-format dataset ingestion verification)
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.resolve(ROOT_DIR, 'backend');

function runVerification() {
  console.log('='.repeat(75));
  console.log('🧪 MANDATORY POST-DEPLOYMENT OPERATIONS VERIFICATION');
  console.log('='.repeat(75));
  console.log('Verifying 3 critical operations: [1 Backend, 1 Database, 1 File Upload]...\n');

  const tsxScript = `
    import { runDeploymentOperationsVerification } from './src/utils/deploymentVerification';
    import app from './src/app';

    async function main() {
      const report = await runDeploymentOperationsVerification(app);
      console.log('__DEPLOYMENT_REPORT_START__' + JSON.stringify(report) + '__DEPLOYMENT_REPORT_END__');
      if (!report.success) {
        process.exit(1);
      }
    }

    main().catch(err => {
      console.error(err);
      process.exit(1);
    });
  `;

  try {
    const tsxCmd = process.platform === 'win32' ? 'npx.cmd tsx' : 'npx tsx';
    const output = execSync(`${tsxCmd} -e "${tsxScript.replace(/\n/g, ' ')}"`, {
      cwd: BACKEND_DIR,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const match = output.match(/__DEPLOYMENT_REPORT_START__(.*)__DEPLOYMENT_REPORT_END__/);
    if (!match) {
      console.error('❌ Failed to parse verification report from output.');
      process.exit(1);
    }

    const report = JSON.parse(match[1]);

    console.log('┌────────────────────────────────────────┬─────────┬──────────┬────────────────────────────────────────────────────────┐');
    console.log('│ Operation Category                     │ Status  │ Latency  │ Verification Details                                   │');
    console.log('├────────────────────────────────────────┼─────────┼──────────┼────────────────────────────────────────────────────────┤');
    
    // 1. Backend Operation
    const beStatus = report.backendOperation.status === 'passed' ? '✔ PASSED' : '✖ FAILED';
    const beLatency = `${report.backendOperation.durationMs}ms`.padEnd(8);
    const beDetails = `Endpoint: ${report.backendOperation.endpoint} (HTTP ${report.backendOperation.statusCode})`.padEnd(54);
    console.log(`│ 1. Backend Service Operation           │ ${beStatus} │ ${beLatency} │ ${beDetails} │`);

    // 2. Database Operation
    const dbStatus = report.databaseOperation.status === 'passed' ? '✔ PASSED' : '✖ FAILED';
    const dbLatency = `${report.databaseOperation.durationMs}ms`.padEnd(8);
    const dbDetails = `Model: ${report.databaseOperation.model} (${report.databaseOperation.recordsRetrieved} records retrieved)`.padEnd(54);
    console.log(`│ 2. Database Store Operation            │ ${dbStatus} │ ${dbLatency} │ ${dbDetails} │`);

    // 3. File Upload Operation
    const fuStatus = report.fileUploadOperation.status === 'passed' ? '✔ PASSED' : '✖ FAILED';
    const fuLatency = `${report.fileUploadOperation.durationMs}ms`.padEnd(8);
    const fuDetails = `File: ${report.fileUploadOperation.fileName} (${report.fileUploadOperation.recordsIngested} rows)`.padEnd(54);
    console.log(`│ 3. File Upload & Ingestion Operation   │ ${fuStatus} │ ${fuLatency} │ ${fuDetails} │`);

    console.log('└────────────────────────────────────────┴─────────┴──────────┴────────────────────────────────────────────────────────┘');

    console.log(`\n🎉 All 3 deployment operations verified successfully in ${report.totalDurationMs}ms!\n`);
    return true;
  } catch (error) {
    console.error('\n❌ Post-deployment operations verification failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runVerification();
}

module.exports = { runVerification };
