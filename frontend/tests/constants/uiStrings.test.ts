import { describe, it, expect } from 'vitest';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('UI_STRINGS Constants & Parameterized Formatters', () => {
  it('should provide static strings for common and header modules', () => {
    expect(UI_STRINGS.common.brand).toBe('PROCUCEV');
    expect(UI_STRINGS.common.engineVersion).toBe('ENGINE 2.0');
    expect(UI_STRINGS.common.save).toBe('Save Changes');
    expect(UI_STRINGS.common.cancel).toBe('Cancel');
    expect(UI_STRINGS.header.brand).toBe('PROCUCEV');
    expect(UI_STRINGS.header.themeToggleDark).toBe('Switch to Dark Mode');
    expect(UI_STRINGS.header.themeToggleLight).toBe('Switch to Light Mode');
  });

  it('should correctly format parameterized header templates', () => {
    expect(UI_STRINGS.header.docRef('TEST-REF-123')).toBe('DOC REF: TEST-REF-123');
    expect(UI_STRINGS.header.authorFormatted('Alice', 'Lead Partner')).toBe('Author: Alice (Lead Partner)');
    expect(UI_STRINGS.header.slaQuery(500)).toBe('SLA: <500ms Query');
    expect(UI_STRINGS.header.currencyTitle('USD')).toBe('USD Base');
  });

  it('should correctly format pipeline and schema templates', () => {
    expect(UI_STRINGS.pipeline.currentStage(2, 'Taxonomy')).toBe('Current Active Stage: [Stage 2: Taxonomy]');
    expect(UI_STRINGS.pipeline.stages[1].title).toBe('Data Ingestion');
    expect(UI_STRINGS.schema.attributesCount(12)).toBe('12 Attributes');
  });

  it('should correctly format module1 summary cards', () => {
    expect(UI_STRINGS.module1.summaryCards.totalRecords(100)).toBe('100 Total Ingested');
    expect(UI_STRINGS.module1.summaryCards.validRecords(80)).toBe('80 Clean Records');
    expect(UI_STRINGS.module1.summaryCards.flaggedRecords(20)).toBe('20 Anomalies Detected');
    expect(UI_STRINGS.module1.summaryCards.remediatedPct(95)).toBe('95% Remediation Rate');
  });

  it('should correctly format module2 confidence scores and vendorSupply templates', () => {
    expect(UI_STRINGS.module2.confidenceScore(92)).toBe('92% Confidence');
    expect(UI_STRINGS.module2.tabVendorSupply).toContain('Top 50 Vendors');
    expect(UI_STRINGS.module2.vendorSupply.alarmObservation(65.2, 284.6, 15)).toContain('65.2%');
    expect(UI_STRINGS.module2.vendorSupply.statAffectedVendorsValue(9, 14)).toBe('9 of 14 Tier 1 Vendors');
    expect(UI_STRINGS.module2.vendorSupply.statHighSpendShareValue(69.1)).toBe('69.1% of Tier Spend');
    expect(UI_STRINGS.module2.vendorSupply.statImpactSpendValue(444.1)).toBe('₹444.10 Cr');
    expect(UI_STRINGS.module2.vendorSupply.statPotentialSavingsValue(37.75)).toContain('₹37.75 Cr');
    expect(UI_STRINGS.module2.vendorSupply.multiShareLabel(60, 100)).toBe('Multi: 60.0% (₹100.0 Cr)');
    expect(UI_STRINGS.module2.vendorSupply.singleShareLabel(40, 50)).toBe('Single: 40.0% (₹50.0 Cr)');
    expect(UI_STRINGS.module2.vendorSupply.badgeCategoryCount(3)).toBe('3 Categories');
    expect(UI_STRINGS.module2.vendorSupply.badgeDisparateSupplies(2)).toBe('+2 Disparate Categories');
    expect(UI_STRINGS.module2.vendorSupply.showingVendorsSummary(20, 50)).toBe('Showing 20 of 50 evaluated suppliers');
    expect(UI_STRINGS.module2.workbenchTitle).toBe('Machine Learning Line Item AI Categorization & Spend Review Workbench');
    expect(UI_STRINGS.module2.unspscCodeBadge('11101234')).toBe('UNSPSC: 11101234');
    expect(UI_STRINGS.module2.searchPlaceholder).toBe('Search description, PO, commodity, code...');
    expect(UI_STRINGS.module2.lineItemHeaders.unspscColLCommodityClass).toBe('UNSPSC Commodity & Class Title');
    expect(UI_STRINGS.module2.lineItemHeaders.unspscColL).toBe('UNSPSC Code & Commodity');
    expect(UI_STRINGS.module2.taxonomyVerifiedFooter).toBe('Multi-Year Spend Taxonomy verified against UNSPSC official commodity catalog');
  });

  it('should correctly format module3 volatility and creep templates', () => {
    expect(UI_STRINGS.module3.volatilityIndex(4)).toBe('Volatility Index: 4');
    expect(UI_STRINGS.module3.priceCreepPct(12.5)).toBe('+12.5% Creep');
    expect(UI_STRINGS.module3.leakageAmount('₹4.2 Cr')).toBe('₹4.2 Cr Leakage');
  });

  it('should correctly format module4 opportunity templates', () => {
    expect(UI_STRINGS.module4.opportunitiesCount(7)).toBe('7 Actionable Savings Levers Identified');
  });

  it('should correctly format modals templates', () => {
    expect(UI_STRINGS.modals.topItems.categoryTitle('Packaging')).toBe('Packaging — Top 10 Line Items & 3-Year Price Trends');
    expect(UI_STRINGS.modals.topItems.vendorTitle('Amcor')).toBe('Amcor — Top Line Items & 3-Year Price Trends');
    expect(UI_STRINGS.modals.dpsNXT.qualifiedBiddersCount(6)).toBe('6 Qualified Bidders Invited');
    expect(UI_STRINGS.modals.mergeVendor.issueLabel).toBe('Issue Description');
    expect(UI_STRINGS.modals.mergeVendor.ignoreButton).toBe('Ignore Issue');
    expect(UI_STRINGS.modals.mergeItem.issueLabel).toBe('Issue Description');
    expect(UI_STRINGS.modals.mergeItem.ignoreButton).toBe('Ignore Issue');
    expect(UI_STRINGS.toasts.issueIgnored('REC-8841')).toBe('Validation anomaly for Record REC-8841 ignored and retained as reviewed.');
    expect(UI_STRINGS.module1.refreshWithFixes).toBe('Refresh with Fixes & See Final Numbers');
    expect(UI_STRINGS.module1.quickRefreshTooltip).toContain('Recalculate spend');
    expect(UI_STRINGS.toasts.refreshedFinalNumbers).toContain('Dataset refreshed with fixes');
    expect(UI_STRINGS.module1.postFixValidation.integrityBadge).toBe('Post-Fix Validations Active');
    expect(UI_STRINGS.module1.postFixValidation.spendReconciliationVerified).toBe('Ground Truth Spend Reconciled');
    expect(UI_STRINGS.module1.postFixValidation.governanceChecksActive(2)).toBe('2 Governance Checks Maintained');
    expect(UI_STRINGS.module1.postFixValidation.zeroDrift).toBe('0 Mathematical Drift');
  });

  it('should correctly format descriptive error strings and templates', () => {
    expect(UI_STRINGS.errors.titles.validation).toBe('Input Validation Failed');
    expect(UI_STRINGS.errors.titles.network).toBe('Network Connection Interrupted');
    expect(UI_STRINGS.errors.titles.auth).toBe('Authentication Required');
    expect(UI_STRINGS.errors.titles.notFound).toBe('Resource Not Found');
    expect(UI_STRINGS.errors.titles.conflict).toBe('Data Conflict Detected');
    expect(UI_STRINGS.errors.titles.server).toBe('Internal System Failure');
    expect(UI_STRINGS.errors.titles.rateLimit).toBe('Request Limit Exceeded');
    expect(UI_STRINGS.errors.titles.generic).toBe('Operation Could Not Be Completed');

    expect(UI_STRINGS.errors.validation.requiredField('email')).toBe('Field "email" is required and cannot be left blank.');
    expect(UI_STRINGS.errors.validation.invalidFormat('phone', '+1-xxx-xxx-xxxx')).toBe('Field "phone" has an invalid format. Expected format: +1-xxx-xxx-xxxx.');
    expect(UI_STRINGS.errors.validation.outOfRange('age', 18, 65)).toBe('Field "age" must be between 18 and 65.');
    expect(UI_STRINGS.errors.validation.actionableAdvice).toContain('Please review highlighted input fields');

    expect(UI_STRINGS.errors.network.offline).toContain('You appear to be offline');
    expect(UI_STRINGS.errors.network.timeout('Upload', 5000)).toBe('The request for "Upload" timed out after 5000ms due to poor latency.');
    expect(UI_STRINGS.errors.network.unreachable('FX API')).toBe('Unable to establish connection to FX API. The service may be temporarily down or undergoing maintenance.');

    expect(UI_STRINGS.errors.auth.sessionExpired).toContain('session has expired');
    expect(UI_STRINGS.errors.auth.insufficientPermissions('Viewer', 'Admin')).toBe('Current role "Viewer" lacks permission. Required privilege: "Admin".');
    expect(UI_STRINGS.errors.auth.tenantAccessDenied('tenant-99')).toBe('Access denied to tenant workspace "tenant-99". Please verify your organization credentials.');

    expect(UI_STRINGS.errors.notFound.entityNotFound('Supplier', 'SUP-999')).toBe('The requested Supplier with identifier "SUP-999" could not be found in the database.');

    expect(UI_STRINGS.errors.conflict.duplicateEntity('Vendor', 'DHL')).toBe('A Vendor with "DHL" already exists in the system.');
    expect(UI_STRINGS.errors.conflict.concurrencyConflict).toContain('simultaneously');

    expect(UI_STRINGS.errors.server.internalError(500, 'req-abc-123')).toBe('Server returned HTTP 500. Diagnostic tracking reference: req-abc-123.');
    expect(UI_STRINGS.errors.server.databaseUnavailable).toContain('database service failed to respond');

    expect(UI_STRINGS.errors.rateLimit.throttled(30)).toBe('API rate limit exceeded. Too many requests in a short interval. Please wait 30s before retrying.');
  });

  it('should format all analyzingLoader strings and parameter functions correctly', () => {
    expect(UI_STRINGS.analyzingLoader.title).toContain('AI Spend Diagnostic');
    expect(UI_STRINGS.analyzingLoader.subtitle).toContain('Autonomous deep inspection');
    expect(UI_STRINGS.analyzingLoader.badge).toBe('Neural Pipeline Active');
    expect(UI_STRINGS.analyzingLoader.dismissButton).toBe('Dismiss');
    expect(UI_STRINGS.analyzingLoader.cancelButton).toBe('Cancel Analysis');
    expect(UI_STRINGS.analyzingLoader.completedBadge).toBe('Analysis Complete');
    expect(UI_STRINGS.analyzingLoader.triggerButton).toBe('Deep Spend Scan');

    // Metrics formatters
    expect(UI_STRINGS.analyzingLoader.metrics.recordsValue(7357)).toBe('7,357 Lines');
    expect(UI_STRINGS.analyzingLoader.metrics.spendValue(8066.86)).toBe('₹8066.86 Cr');
    expect(UI_STRINGS.analyzingLoader.metrics.vendorsValue(1073)).toBe('1,073 Vendors');
    expect(UI_STRINGS.analyzingLoader.metrics.categoriesValue(48)).toBe('48 Categories');
    expect(UI_STRINGS.analyzingLoader.metrics.confidenceValue(99.4)).toBe('99.4%');

    // Progress formatters
    expect(UI_STRINGS.analyzingLoader.overallProgress(75)).toBe('75% Complete');

    // Phases
    expect(UI_STRINGS.analyzingLoader.phases.ingestionTitle).toBeTruthy();
    expect(UI_STRINGS.analyzingLoader.phases.taxonomyTitle).toBeTruthy();
    expect(UI_STRINGS.analyzingLoader.phases.vendorSupplyTitle).toBeTruthy();
    expect(UI_STRINGS.analyzingLoader.phases.anomalyTitle).toBeTruthy();
  });

  it('should correctly provide vendorConsolidation strings and formatters', () => {
    const vc = UI_STRINGS.vendorConsolidation;
    expect(vc.badge).toBe('RECURRING PROCUREMENT OPTIMIZATION & VENDOR CONSOLIDATION');
    expect(vc.title).toContain('High-Value Recurring Spend');
    expect(vc.kpiActiveVendorsSub(7.8)).toBe('Avg. 7.8 Suppliers / Category');
    expect(vc.kpiVolumeSavingsSub(14.5)).toBe('14.5% Projected Addressable Savings');
    expect(vc.showingItemsCount(6, 6)).toBe('Displaying 6 of 6 high-value recurring categories (> 5 vendors)');
    expect(vc.vendorCountBadge(8)).toBe('8 Active Suppliers (Fragmented)');
    expect(vc.monthlyPoBadge(42)).toBe('Avg. 42 POs / Mo');
    expect(vc.priceVarianceValue(14.8)).toBe('+14.8% Variance');
    expect(vc.targetConsolidationValue(2)).toBe('Consolidate to 2 Strategic Suppliers');
    expect(vc.volumeBenefitValue(5.58, 14.5)).toBe('₹5.58 Cr (14.5%)');
    expect(vc.auctionPlatformLabel('DPS NXT')).toBe('via DPS NXT Dynamic e-Auction');
    expect(vc.modalTitle('Corrugated Boxes')).toBe('Vendor Consolidation & Volume Benefit Strategy: Corrugated Boxes');
    expect(vc.fragmentationAlertBody(8, 14.8)).toContain('8 separate vendors');
  });

  it('should correctly provide poConsolidation strings and formatters', () => {
    const pc = UI_STRINGS.poConsolidation;
    expect(pc.badge).toBe('MULTIPLE PO CONSOLIDATION & ECONOMIES OF SCALE');
    expect(pc.title).toContain('Multiple Monthly PO Consolidation');
    expect(pc.kpiTotalCurrentPosSub(6)).toBe('Across 6 High-Frequency Accounts');
    expect(pc.kpiTargetPosSub(94.2)).toBe('94.2% Transaction Reduction');
    expect(pc.kpiEconomiesOfScaleSub(26.5)).toBe('Incl. ₹26.5L Administrative Savings');
    expect(pc.showingItemsCount(6, 6)).toBe('Displaying 6 of 6 high-frequency PO supplier accounts');
    expect(pc.monthlyPoBadge(12)).toBe('12 POs Released / Month');
    expect(pc.annualPoBadge(144)).toBe('144 POs / Year');
    expect(pc.avgPoValueVal(44.79)).toBe('₹44.79 Lakhs');
    expect(pc.scaleSavingsValue(10.32, 16.0)).toBe('₹10.32 Cr (16.0%)');
    expect(pc.adminSavingsValue(5.0)).toBe('₹5.0 Lakhs');
    expect(pc.modalTitle('Jindal Stainless')).toBe('PO Consolidation & Rate Contracting: Jindal Stainless');
    expect(pc.currentPoFrequencyVal(12, 144)).toBe('Avg 12 POs/month (144 POs/year)');
  });
});

