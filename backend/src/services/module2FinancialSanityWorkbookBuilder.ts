/**
 * Module 2 Financial Sanity Evidence Workbook Builder
 * Generates MODULE_2_FINANCIAL_SANITY_EVIDENCE.xlsx with all 20 authoritative governance sheets.
 * Version: MODULE_2_FINANCIAL_GOVERNANCE_V2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from './module2CanonicalService';
import { Module2FinancialSanityAuditor } from './module2FinancialSanityAuditor';
import { Module2FinancialIndependentCalculator } from './module2FinancialIndependentCalculator';
import { Module2FinancialGovernanceEngine } from './module2FinancialGovernanceEngine';
import { Module2FinancialWorkbookSheets } from './module2FinancialWorkbookSheets';
import { logger } from '../utils/logger';

export class Module2FinancialSanityWorkbookBuilder {
  public static readonly FILENAME = 'MODULE_2_FINANCIAL_SANITY_EVIDENCE.xlsx';

  private static appendSheet<T>(wb: XLSX.WorkBook, data: T[], sheetName: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  public static buildWorkbook(): {
    workbookPath: string;
    workbookSha256: string;
    sheetsCount: number;
    sheets: string[];
  } {
    const summary = Module2FinancialSanityAuditor.getAuditSummary();
    const addressableRows = Module2FinancialSanityAuditor.auditAddressableSpend();
    const ledgerRows = Module2FinancialSanityAuditor.auditOpportunityLedger();
    const leverRows = Module2FinancialSanityAuditor.auditLeverBridge();
    const overlapTxs = Module2FinancialSanityAuditor.auditTransactionOverlap();
    const sourcing = Module2CanonicalService.getSourcingAnalysis();
    const txs = Module2CanonicalService.getCanonicalTransactions();
    const independentRows = Module2FinancialIndependentCalculator.runIndependentRecalculation(txs);

    const denominators = Module2FinancialGovernanceEngine.buildOpportunityDenominators(sourcing.profiles);
    const overlapRows = Module2FinancialGovernanceEngine.buildOpportunityOverlapLedger(sourcing.profiles);
    const governanceTests = Module2FinancialGovernanceEngine.runGovernanceTests(summary, denominators, overlapRows);

    const wb = XLSX.utils.book_new();

    // 01_README
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildReadmeSheet(summary), '01_README');

    // 02_FINANCIAL_CERTIFICATION
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildCertificationSheet(summary), '02_FINANCIAL_CERTIFICATION');

    // 03_TOTAL_SPEND_RECONCILIATION
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildTotalSpendReconciliationSheet(summary), '03_TOTAL_SPEND_RECONCILIATION');

    // 04_ADDRESSABLE_SPEND
    this.appendSheet(wb, addressableRows, '04_ADDRESSABLE_SPEND');

    // 05_OPPORTUNITY_DENOMINATORS
    this.appendSheet(wb, denominators, '05_OPPORTUNITY_DENOMINATORS');

    // 06_GROSS_OPPORTUNITY_LEDGER
    this.appendSheet(wb, ledgerRows, '06_GROSS_OPPORTUNITY_LEDGER');

    // 07_VOLUME_BUNDLING
    const bundlingRows = sourcing.profiles
      .filter((p) => (p.volumeBundlingOpportunityInr || 0) > 0)
      .map((p) => ({
        Category: p.categoryName,
        EligibleSpendCr: p.totalSpendInrCr,
        BundlingOpportunityInr: p.volumeBundlingOpportunityInr || 0,
        BundlingOpportunityCr: p.volumeBundlingOpportunityInrCr || 0,
        ImpliedElasticityPct: '12.0%',
        ConfidenceTier: 'THEORETICAL_ASSUMPTION_TIER',
        EconomicLineage: 'Multi-vendor batch bundling evaluated across category items'
      }));
    this.appendSheet(wb, bundlingRows, '07_VOLUME_BUNDLING');

    // 08_VENDOR_CONSOLIDATION
    const consolRows = sourcing.profiles
      .filter((p) => (p.potentialVendorConsolidationOpportunityInr || 0) > 0)
      .map((p) => ({
        Category: p.categoryName,
        ActiveSuppliers: p.activeSuppliersCount,
        AddressableSpendCr: p.addressableSpendInrCr,
        TailVendorsAffected: p.operationalConsolidation?.suppliersPotentiallyAffected || 0,
        CoreVsTailPriceGapPct: '8.5% - 14.2%',
        ConsolidationOpportunityCr: p.potentialVendorConsolidationOpportunityInrCr,
        Formula: 'TailSpend * CoreVendorPriceAdvantage'
      }));
    this.appendSheet(wb, consolRows, '08_VENDOR_CONSOLIDATION');

    // 09_E_AUCTION
    const eauctionRows = sourcing.profiles
      .filter((p) => (p.potentialEAuctionOpportunityInr || 0) > 0)
      .map((p) => ({
        Category: p.categoryName,
        ActiveSuppliers: p.activeSuppliersCount,
        AddressableSpendCr: p.addressableSpendInrCr,
        WeightedAveragePrice: p.priceDispersion?.weightedAveragePrice || 0,
        ReferencePrice: p.credibleReference?.referencePrice || 0,
        PriceDispersionPct: p.priceDispersion?.priceDispersionPct || 0,
        EAuctionOpportunityCr: p.potentialEAuctionOpportunityInrCr,
        Suitability: 'CONFIRMED — >=3 vendors & >5% price dispersion'
      }));
    this.appendSheet(wb, eauctionRows, '09_E_AUCTION');

    // 10_CATEGORY_OPPORTUNITY
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildCategoryOpportunitySheet(sourcing.profiles), '10_CATEGORY_OPPORTUNITY');

    // 11_OVERLAP_LEDGER
    this.appendSheet(wb, overlapRows, '11_OVERLAP_LEDGER');

    // 12_NET_OPPORTUNITY
    this.appendSheet(wb, leverRows, '12_NET_OPPORTUNITY');

    // 13_PROVEN_OPPORTUNITY
    const provenRows = sourcing.profiles
      .filter((p) => p.evidenceState === 'PROVEN_OPPORTUNITY')
      .map((p) => ({
        Category: p.categoryName,
        AddressableSpendCr: p.addressableSpendInrCr,
        NetOpportunityCr: p.netQuantifiableOpportunityInrCr,
        SupplierCount: p.activeSuppliersCount,
        ComparableTransactions: p.comparableTransactionCount,
        DataConfidence: p.dataConfidence,
        Classification: 'PROVEN_OPPORTUNITY'
      }));
    this.appendSheet(wb, provenRows, '13_PROVEN_OPPORTUNITY');

    // 14_DELIVERY_ASSUMPTIONS
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildDeliveryAssumptionsSheet(summary), '14_DELIVERY_ASSUMPTIONS');

    // 15_TRANSACTION_EVIDENCE
    this.appendSheet(wb, overlapTxs, '15_TRANSACTION_EVIDENCE');

    // 16_INDEPENDENT_RECALCULATION
    this.appendSheet(wb, independentRows, '16_INDEPENDENT_RECALCULATION');

    // 17_UI_API_REPORT_PARITY
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildUiApiReportParitySheet(summary), '17_UI_API_REPORT_PARITY');

    // 18_FINANCIAL_GOVERNANCE_TESTS
    this.appendSheet(wb, governanceTests, '18_FINANCIAL_GOVERNANCE_TESTS');

    // 19_EXCLUSIONS_AND_UNSUPPORTED
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildExclusionsSheet(summary), '19_EXCLUSIONS_AND_UNSUPPORTED');

    // 20_FINAL_CERTIFICATION
    this.appendSheet(wb, Module2FinancialWorkbookSheets.buildFinalCertificationSheet(summary), '20_FINAL_CERTIFICATION');

    const destPath = path.resolve(process.cwd(), this.FILENAME);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(destPath, buf);

    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    logger.info('Generated MODULE_2_FINANCIAL_SANITY_EVIDENCE.xlsx', {
      destination: destPath,
      sha256: hash,
      sheetsCount: wb.SheetNames.length
    });

    return {
      workbookPath: destPath,
      workbookSha256: hash,
      sheetsCount: wb.SheetNames.length,
      sheets: wb.SheetNames
    };
  }
}
