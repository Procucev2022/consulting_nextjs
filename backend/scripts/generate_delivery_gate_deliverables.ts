import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AiCevManagementReportPdfBuilder } from '../src/services/aiCevManagementReportPdfBuilder';
import { AiCevManagementReportPptxBuilder } from '../src/services/aiCevManagementReportPptxBuilder';
import { AiCevManagementReportBuilder } from '../src/services/aiCevManagementReportBuilder';
import { saveCommercialScenarioRegister } from '../src/services/borosilCommercialScenarioRegisterService';
import { resolveAuthoritativeAssessment } from '../src/utils/assessmentContextResolver';
import { logger } from '../src/utils/logger';

async function main(): Promise<void> {
  const assessment = resolveAuthoritativeAssessment('AIC-2026-0002');
  const report = AiCevManagementReportBuilder.buildBorosilReport(assessment);

  // Generate and save PDF & PPTX artifacts
  const pdfRes = AiCevManagementReportPdfBuilder.savePdfArtifacts();
  const pptxRes = await AiCevManagementReportPptxBuilder.savePptxArtifacts();
  const registerRes = saveCommercialScenarioRegister();

  // Root directory and paths
  const backendDir = path.resolve(__dirname, '..');
  const rootDir = path.resolve(backendDir, '..');
  const devReportsDir = path.resolve(rootDir, 'data/dev/assessments/AIC-2026-0002/reports');

  if (!fs.existsSync(devReportsDir)) {
    fs.mkdirSync(devReportsDir, { recursive: true });
  }

  const jsonFilename = 'aiCEV_Executive_Management_Report_AIC-2026-0002.json';
  const jsonContent = JSON.stringify(report, null, 2);
  const jsonBackendPath = path.resolve(backendDir, jsonFilename);
  const jsonRootPath = path.resolve(rootDir, jsonFilename);
  const jsonDevReportsPath = path.resolve(devReportsDir, jsonFilename);

  fs.writeFileSync(jsonBackendPath, jsonContent, 'utf-8');
  fs.writeFileSync(jsonRootPath, jsonContent, 'utf-8');
  fs.writeFileSync(jsonDevReportsPath, jsonContent, 'utf-8');

  // Verify Checksums & Details
  const pdfBytes = fs.readFileSync(pdfRes.briefPath);
  const pptxBytes = fs.readFileSync(pptxRes.briefPath);
  const jsonBytes = fs.readFileSync(jsonDevReportsPath);

  const pdfSha256 = crypto.createHash('sha256').update(pdfBytes).digest('hex');
  const pptxSha256 = crypto.createHash('sha256').update(pptxBytes).digest('hex');
  const jsonSha256 = crypto.createHash('sha256').update(jsonBytes).digest('hex');

  const pdfText = pdfBytes.toString('binary');
  const jsonText = jsonBytes.toString('utf-8');

  // Verify zero occurrences of 78.324 or legacy 92.072
  if (pdfText.includes('78.324') || jsonText.includes('78.324')) {
    throw new Error('FATAL: Found 78.324 in generated deliverables!');
  }
  if (pdfText.includes('92.072') || jsonText.includes('92.072')) {
    throw new Error('FATAL: Found legacy 92.072 in generated deliverables!');
  }

  // Verify presence of 87.100 and 75.121
  if (!pdfText.includes('87.100') || !jsonText.includes('87.100')) {
    throw new Error('FATAL: Missing 87.100 in generated deliverables!');
  }
  if (!pdfText.includes('75.121') || !jsonText.includes('75.121')) {
    throw new Error('FATAL: Missing 75.121 in generated deliverables!');
  }

  // Verify presence of 1537 / 1,537 Active SAP Supplier Accounts
  if (!pdfText.includes('1,537') && !pdfText.includes('1537')) {
    throw new Error('FATAL: Missing 1,537 supplier count in generated deliverables!');
  }

  const registerBytes = fs.readFileSync(registerRes.reportPath);
  const registerSha256 = crypto.createHash('sha256').update(registerBytes).digest('hex');

  const result = {
    pdf: {
      path: pdfRes.briefPath,
      sizeBytes: pdfBytes.length,
      pageCount: AiCevManagementReportPdfBuilder.SLIDE_COUNT,
      sha256: pdfSha256
    },
    pptx: {
      path: pptxRes.briefPath,
      sizeBytes: pptxBytes.length,
      slideCount: AiCevManagementReportPptxBuilder.SLIDE_COUNT,
      sha256: pptxSha256
    },
    json: {
      path: jsonDevReportsPath,
      sizeBytes: jsonBytes.length,
      sectionsCount: Object.keys(report).filter(k => k.startsWith('section')).length,
      sha256: jsonSha256
    },
    scenarioRegister: {
      path: registerRes.reportPath,
      sizeBytes: registerBytes.length,
      scenariosCount: 6,
      sha256: registerSha256
    }
  };

  logger.info('Delivery Gate Deliverables Generated and Verified Cleanly', result);
  // Output result JSON to stdout for confirmation
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main().catch(err => {
  console.error('FAILED TO GENERATE DELIVERABLES:', err);
  logger.error('Failed to generate delivery gate deliverables', {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });
  process.exit(1);
});
