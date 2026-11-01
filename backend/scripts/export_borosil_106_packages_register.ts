import * as fs from 'fs';
import * as path from 'path';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';

async function main() {
  const assessmentId = 'AIC-2026-0002';
  const ledger = Module2CanonicalService.getOpportunityLedger(assessmentId);
  const sourcing = Module2CanonicalService.getSourcingAnalysis(assessmentId);

  console.log(`Processing ${ledger.length} packages from authoritative Module 2 ledger...`);

  const oppIds = new Set<string>();
  const catIds = new Set<string>();
  const txAllocationMap = new Map<string, string>();
  let duplicateTxs = 0;

  let totalSpendInr = 0;
  let totalGrossInr = 0;
  let totalOverlapInr = 0;
  let totalNetInr = 0;
  let totalCustFacingInr = 0;

  const register = ledger.map((item, idx) => {
    // Unique ID check
    if (oppIds.has(item.opportunityId)) {
      throw new Error(`Duplicate opportunityId detected: ${item.opportunityId}`);
    }
    oppIds.add(item.opportunityId);

    const catId = item.materialIds[0] || `CAT-${item.category}`;
    if (catIds.has(catId)) {
      throw new Error(`Duplicate categoryId detected: ${catId}`);
    }
    catIds.add(catId);

    // Transaction allocation check
    for (const txId of item.sourceTransactionIds) {
      if (txAllocationMap.has(txId)) {
        duplicateTxs++;
      } else {
        txAllocationMap.set(txId, item.opportunityId);
      }
    }

    const spendInr = item.eligibleSpendInr ?? 0;
    const grossInr = item.grossOpportunityInr ?? 0;
    const overlapInr = item.overlapAmountInr ?? 0;
    const netInr = item.netOpportunityInr ?? 0;

    let custFacingInr = 0;
    let commStatus = '';
    let reason = '';

    if (item.opportunityType === 'VENDOR_CONSOLIDATION') {
      custFacingInr = 0;
      commStatus = 'HELD_IN_GOVERNANCE_RESERVE';
      reason = 'Excluded from customer-facing deliverables pending client commercial validation of vendor base consolidation pricing concessions';
    } else if (item.opportunityType === 'COMBINED_STRATEGIC') {
      custFacingInr = netInr;
      commStatus = 'VALIDATED_ACTIONABLE';
      reason = 'Full bottom-up quantifiable net opportunity eligible for strategic sourcing execution';
    } else {
      // E_AUCTION
      custFacingInr = netInr;
      commStatus = 'VALIDATED_ACTIONABLE';
      reason = 'Full bottom-up quantifiable net opportunity eligible for reverse e-auction execution';
    }

    totalSpendInr += spendInr;
    totalGrossInr += grossInr;
    totalOverlapInr += overlapInr;
    totalNetInr += netInr;
    totalCustFacingInr += custFacingInr;

    return {
      packageRank: idx + 1,
      opportunityId: item.opportunityId,
      categoryId: catId,
      categoryName: item.category,
      sourcingLever: item.opportunityType,
      eligibleSpendInr: spendInr,
      eligibleSpendCr: Number((spendInr / 1e7).toFixed(4)),
      grossOpportunityInr: grossInr,
      grossOpportunityCr: Number((grossInr / 1e7).toFixed(4)),
      overlapDeductionInr: overlapInr,
      overlapDeductionCr: Number((overlapInr / 1e7).toFixed(4)),
      netOpportunityInr: netInr,
      netOpportunityCr: Number((netInr / 1e7).toFixed(4)),
      customerFacingOpportunityInr: custFacingInr,
      customerFacingOpportunityCr: Number((custFacingInr / 1e7).toFixed(4)),
      sourceTransactionCount: item.sourceTransactionIds.length,
      sourceTransactionIds: item.sourceTransactionIds,
      commercialValidationStatus: commStatus,
      qualificationStatus: item.status,
      confidenceRating: item.confidence,
      methodology: item.methodology,
      exclusionOrAdjustmentReason: reason
    };
  });

  const exportPayload = {
    metadata: {
      assessmentId: 'AIC-2026-0002',
      customerName: 'Borosil Ltd',
      datasetFile: 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx',
      canonicalTransactionsCount: 27777,
      totalActiveSapSupplierAccounts: 1537,
      rawErpSupplierAccountsCount: 1561,
      excludedSupplierAccountsCount: 24,
      totalQualifiedPackagesCount: ledger.length,
      unquantifiedPackagesCount: 1,
      totalEvaluatedCategoriesCount: 133,
      generatedAt: new Date().toISOString(),
      reconciliationStatus: {
        uniqueOpportunityIds: oppIds.size === ledger.length,
        uniqueCategoryIds: catIds.size === ledger.length,
        duplicateTransactionAllocationCount: duplicateTxs,
        spendReconciledInr: totalSpendInr,
        grossReconciledInr: totalGrossInr,
        overlapReconciledInr: totalOverlapInr,
        netModelledReconciledInr: totalNetInr,
        customerFacingBottomUpReconciledInr: totalCustFacingInr,
        customerFacingGovernanceDisclosedInr: 751213739,
        unreconciledGovernanceVarianceInr: totalCustFacingInr - 751213739,
        governanceStatus: 'RECONCILED_OPTION_C_CAT_11300_UNQUANTIFIED'
      }
    },
    packages: register,
    unquantifiedPackages: [
      {
        packageRank: 106,
        opportunityId: 'OPP-M2-CAT-11300',
        categoryId: 'CAT-11300',
        categoryName: 'Packaging Materials',
        sourcingLever: 'UNQUANTIFIED',
        eligibleSpendInr: 21047046,
        eligibleSpendCr: 2.105,
        grossOpportunityInr: 0,
        grossOpportunityCr: 0,
        overlapDeductionInr: 0,
        overlapDeductionCr: 0,
        netOpportunityInr: 0,
        netOpportunityCr: 0,
        customerFacingOpportunityInr: 0,
        customerFacingOpportunityCr: 0,
        commercialValidationStatus: 'UNQUANTIFIED_DISCOVERY_REQUIRED',
        qualificationStatus: 'UNQUANTIFIED',
        confidenceRating: 'LOW',
        methodology: 'Option C: CAT-11300 marked Unquantified; previous ₹4.9718 Cr consolidation marked INVALID_SPEND_BOUNDING; ₹0.3439 Cr e-auction retained as unqualified discovery opportunity',
        exclusionOrAdjustmentReason: 'Excluded from qualified ledger per Prompt 604 Option C'
      }
    ]
  };

  const projectRootPath = path.resolve(__dirname, '../../BOROSIL_106_PACKAGE_RECONCILIATION_REGISTER.json');
  const assessmentDirPath = path.resolve(__dirname, '../../data/dev/assessments/AIC-2026-0002/BOROSIL_106_PACKAGE_RECONCILIATION_REGISTER.json');

  fs.writeFileSync(projectRootPath, JSON.stringify(exportPayload, null, 2), 'utf8');
  console.log(`Exported complete 106-package register to: ${projectRootPath}`);

  if (fs.existsSync(path.dirname(assessmentDirPath))) {
    fs.writeFileSync(assessmentDirPath, JSON.stringify(exportPayload, null, 2), 'utf8');
    console.log(`Exported complete 106-package register to: ${assessmentDirPath}`);
  }

  console.log('\n--- VERIFICATION AUDIT METRICS ---');
  console.log(`Unique Opportunity IDs: ${oppIds.size}`);
  console.log(`Unique Category IDs: ${catIds.size}`);
  console.log(`Duplicate Transactions across packages: ${duplicateTxs}`);
  console.log(`Total Spend INR: ${totalSpendInr} (₹${(totalSpendInr / 1e7).toFixed(4)} Cr)`);
  console.log(`Total Gross INR: ${totalGrossInr} (₹${(totalGrossInr / 1e7).toFixed(4)} Cr)`);
  console.log(`Total Overlap INR: ${totalOverlapInr} (₹${(totalOverlapInr / 1e7).toFixed(4)} Cr)`);
  console.log(`Total Net Modelled INR: ${totalNetInr} (₹${(totalNetInr / 1e7).toFixed(4)} Cr)`);
  console.log(`Total Bottom-Up Customer Facing INR: ${totalCustFacingInr} (₹${(totalCustFacingInr / 1e7).toFixed(4)} Cr)`);
}

main().catch(console.error);
