import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as xlsx from 'xlsx';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { resolveAuthoritativeAssessment } from '../src/utils/assessmentContextResolver';
import { AiCevManagementReportBuilder } from '../src/services/aiCevManagementReportBuilder';

async function main(): Promise<void> {
  const rootDir = path.resolve(__dirname, '../..');
  const backendDir = path.resolve(__dirname, '..');

  console.log('================ FORENSIC EXACT RECONCILIATION ================');

  // 1. SHA-256 of original uploaded PO file
  const poFilePath = path.resolve(
    rootDir,
    'data/dev/assessments/AIC-2026-0002/uploads/Borosil_PO_Consol_Excluding_BSL_Pune.xlsx'
  );
  if (fs.existsSync(poFilePath)) {
    const poBytes = fs.readFileSync(poFilePath);
    const poSha256 = crypto.createHash('sha256').update(poBytes).digest('hex');
    console.log(`PO File Path: ${poFilePath}`);
    console.log(`PO File Size: ${poBytes.length} bytes`);
    console.log(`PO File SHA-256: ${poSha256}`);
  } else {
    console.log(`PO File NOT FOUND at: ${poFilePath}`);
  }

  // 2. Inspect MODULE_1_CERTIFIED_HANDOFF.json
  const handoffPath = path.resolve(rootDir, 'MODULE_1_CERTIFIED_HANDOFF.json');
  let handoffSpendSum = 0;
  let handoffTxCount = 0;
  if (fs.existsSync(handoffPath)) {
    const handoffData = JSON.parse(fs.readFileSync(handoffPath, 'utf-8'));
    console.log(`MODULE_1_CERTIFIED_HANDOFF metadata:`, handoffData.metadata || 'No metadata block');
    const transactions = Array.isArray(handoffData) ? handoffData : (handoffData.transactions || handoffData.canonicalTransactions || []);
    handoffTxCount = transactions.length;
    for (const tx of transactions) {
      handoffSpendSum += Number(tx.lineSpendInr ?? tx.spendInr ?? tx.amountInr ?? 0);
    }
    console.log(`MODULE_1_CERTIFIED_HANDOFF txCount: ${handoffTxCount}`);
    console.log(`MODULE_1_CERTIFIED_HANDOFF spendSum: ${handoffSpendSum}`);
  }

  // 3. Inspect AssessmentRecord
  const assessment = resolveAuthoritativeAssessment('AIC-2026-0002');
  console.log(`Assessment Record:`, {
    assessmentId: assessment.id,
    customerName: assessment.customer_name,
    totalSpendInr: assessment.metrics?.total_spend_inr ?? assessment.totalSpendInr,
    recordCount: assessment.metrics?.record_count ?? assessment.recordCount,
    spendBaselineCr: assessment.metrics?.total_spend_cr ?? assessment.spendBaselineCr
  });

  // 4. Inspect Module2CanonicalService
  const ledger = Module2CanonicalService.getOpportunityLedger('AIC-2026-0002');
  const sourcing = Module2CanonicalService.getSourcingAnalysis('AIC-2026-0002');

  console.log(`Module 2 Opportunity Ledger: ${ledger.length} packages`);
  let ledgerSpend = 0;
  let ledgerGross = 0;
  let ledgerOverlap = 0;
  let ledgerNet = 0;
  let l1Net = 0;
  let l2Net = 0;
  let l3Net = 0;

  for (const pkg of ledger) {
    ledgerSpend += pkg.eligibleSpendInr ?? 0;
    ledgerGross += pkg.grossOpportunityInr ?? 0;
    ledgerOverlap += pkg.overlapDeductionInr ?? 0;
    ledgerNet += pkg.netDefensibleOpportunityInr ?? 0;
    if (pkg.sourcingLever === 'COMBINED_STRATEGIC' || pkg.sourcingLever === 'DIRECT_PRICE_IMPROVEMENT') {
      l1Net += pkg.netDefensibleOpportunityInr ?? 0;
    } else if (pkg.sourcingLever === 'VENDOR_CONSOLIDATION') {
      l2Net += pkg.netDefensibleOpportunityInr ?? 0;
    } else if (pkg.sourcingLever === 'DYNAMIC_E_AUCTION') {
      l3Net += pkg.netDefensibleOpportunityInr ?? 0;
    }
  }

  console.log('Ledger sum of 106 packages:', {
    ledgerSpend,
    ledgerGross,
    ledgerOverlap,
    ledgerNet,
    l1Net,
    l2Net,
    l3Net,
    exclL2: l1Net + l3Net
  });

  console.log('Module 2 Sourcing Analysis Object:', {
    categoriesCount: sourcing.categoriesCount,
    totalAddressableSpendInr: sourcing.totalAddressableSpendInr,
    totalGrossOpportunityInr: sourcing.totalGrossOpportunityInr,
    totalOverlapDeductionsInr: sourcing.totalOverlapDeductionsInr,
    totalNetOpportunityInr: sourcing.totalNetOpportunityInr,
    handoffPackagesCount: sourcing.handoffPackagesCount
  });

  // 5. Inspect AiCevManagementReportBuilder output
  const report = AiCevManagementReportBuilder.buildBorosilReport(assessment);
  console.log('AiCevManagementReportBuilder Section 3:', report.section3ExecutiveSummary);
  console.log('AiCevManagementReportBuilder Section 4:', report.section4SpendBaseline);
  console.log('AiCevManagementReportBuilder Section 1 Spend Breakdown:', (report as any).section1SpendBreakdown);

  // 6. Compare with 106-Package Register JSON
  const regPath = path.resolve(rootDir, 'BOROSIL_106_PACKAGE_RECONCILIATION_REGISTER.json');
  if (fs.existsSync(regPath)) {
    const regData = JSON.parse(fs.readFileSync(regPath, 'utf-8'));
    console.log('Reconciliation Register Metadata status:', regData.metadata.reconciliationStatus);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
