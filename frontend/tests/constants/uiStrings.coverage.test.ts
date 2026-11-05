import { afterEach, describe, expect, it, vi } from 'vitest';
import { UI_STRINGS } from '../../src/constants/uiStrings';

const expectTextWithFragments = (text: string, fragments: string[]): void => {
  expect(text.trim().length).toBeGreaterThan(0);
  for (const fragment of fragments) {
    expect(text).toContain(fragment);
  }
};

const FORMATTER_CASES: Array<[string, () => string, string[]]> = [
  ['databaseData.opportunityHandoffFailed', () => UI_STRINGS.databaseData.opportunityHandoffFailed(503), ['503', 'D1', 'Retry']],
  ['module4.actionPlan.activeCount', () => UI_STRINGS.module4.actionPlan.activeCount(3), ['3', 'action plans']],
  ['taxonomyData.loadFailed', () => UI_STRINGS.taxonomyData.loadFailed('catalog offline', 'req-7'), ['catalog offline', 'req-7']],
  ['taxonomyData.httpFailure', () => UI_STRINGS.taxonomyData.httpFailure(503), ['503']],
  ['common.croreAmount', () => UI_STRINGS.common.croreAmount('1,234.50'), ['1,234.50']],

  ['module1.filterTabs.allRecords', () => UI_STRINGS.module1.filterTabs.allRecords(12), ['12']],
  ['module1.filterTabs.needsAction', () => UI_STRINGS.module1.filterTabs.needsAction(7), ['7']],
  ['module1.filterTabs.quarantinedSpendBadge', () => UI_STRINGS.module1.filterTabs.quarantinedSpendBadge(42.5), ['42.50']],
  ['module1.filterTabs.quarantinedTooltip', () => UI_STRINGS.module1.filterTabs.quarantinedTooltip(5, 3, 120.456), ['120.46', '8']],
  ['module1.filterTabs.conversion', () => UI_STRINGS.module1.filterTabs.conversion(4), ['4']],
  ['module1.filterTabs.vendorDuplication', () => UI_STRINGS.module1.filterTabs.vendorDuplication(6), ['6']],
  ['module1.filterTabs.itemDuplication', () => UI_STRINGS.module1.filterTabs.itemDuplication(9), ['9']],
  ['module1.filterTabs.readyAndCleared', () => UI_STRINGS.module1.filterTabs.readyAndCleared(15), ['15']],

  ['module1.viewBalanceCategories', () => UI_STRINGS.module1.viewBalanceCategories(3), ['3']],
  ['module1.hideBalanceCategories', () => UI_STRINGS.module1.hideBalanceCategories(4), ['4']],
  ['module1.viewBalanceSuppliers', () => UI_STRINGS.module1.viewBalanceSuppliers(8), ['8']],
  ['module1.hideBalanceSuppliers', () => UI_STRINGS.module1.hideBalanceSuppliers(9), ['9']],
  ['module1.processingStatus', () => UI_STRINGS.module1.processingStatus(87), ['87']],
  ['module1.fileSizeMb', () => UI_STRINGS.module1.fileSizeMb(1.25), ['1.25']],
  ['module1.uploadMetadata', () => UI_STRINGS.module1.uploadMetadata('CSV', '2 MB', '2026-10-31'), ['CSV', '2 MB', '2026-10-31']],
  ['module1.uploadProgress', () => UI_STRINGS.module1.uploadProgress(85, 'Parsing'), ['85', 'Parsing']],
  ['module1.recordCount', () => UI_STRINGS.module1.recordCount(1250), ['1,250', 'Records']],
  ['module1.spendFromFile (present)', () => UI_STRINGS.module1.spendFromFile(2.5), ['2.50', 'Cr']],
  ['module1.evaluatedSpend (present)', () => UI_STRINGS.module1.evaluatedSpend(2.5), ['2.50']],
  ['module1.evaluatedSpend (missing)', () => UI_STRINGS.module1.evaluatedSpend(), ['unavailable']],

  ['module1.paretoHierarchy.showingSummary', () => UI_STRINGS.module1.paretoHierarchy.showingSummary(10, 50, 80), ['10', '80']],
  ['module1.paretoHierarchy.cumulativeLabel', () => UI_STRINGS.module1.paretoHierarchy.cumulativeLabel('12.34'), ['12.34']],
  ['module1.paretoHierarchy.childItemsCount (singular)', () => UI_STRINGS.module1.paretoHierarchy.childItemsCount(1), ['1']],
  ['module1.paretoHierarchy.childItemsCount (plural)', () => UI_STRINGS.module1.paretoHierarchy.childItemsCount(5), ['5']],
  ['module1.paretoHierarchy.childVendorsCount (singular)', () => UI_STRINGS.module1.paretoHierarchy.childVendorsCount(1), ['1']],
  ['module1.paretoHierarchy.childVendorsCount (plural)', () => UI_STRINGS.module1.paretoHierarchy.childVendorsCount(4), ['4']],

  ['documentSummary.subheading', () => UI_STRINGS.documentSummary.subheading('sales.xlsx', 250), ['sales.xlsx', '250']],
  ['documentSummary.subheading (no file name or count)', () => UI_STRINGS.documentSummary.subheading('', undefined), ['N/A']],
  ['documentSummary.suspectedDuplicatesNote', () => UI_STRINGS.documentSummary.suspectedDuplicatesNote(340), ['340']],
  ['documentSummary.distinctMaterialsCount', () => UI_STRINGS.documentSummary.distinctMaterialsCount(980), ['980']],
  ['documentSummary.distinctSuppliersCount', () => UI_STRINGS.documentSummary.distinctSuppliersCount(45), ['45']],
  ['documentSummary.dynamicGroupsCount', () => UI_STRINGS.documentSummary.dynamicGroupsCount(6), ['6']],
  ['documentSummary.dynamicFacilitiesCount', () => UI_STRINGS.documentSummary.dynamicFacilitiesCount(3), ['3']],
  ['documentSummary.dateRangeValue (labelled)', () => UI_STRINGS.documentSummary.dateRangeValue(12, 'Ingestion Timeframe'), ['Ingestion Timeframe', '12']],
  ['documentSummary.dateRangeValue (six months)', () => UI_STRINGS.documentSummary.dateRangeValue(6), ['6']],
  ['documentSummary.acrossBillingMonths', () => UI_STRINGS.documentSummary.acrossBillingMonths(24), ['24']],

  ['documentSummary.reconciliation.allScope', () => UI_STRINGS.documentSummary.reconciliation.allScope(5), ['5']],
  [
    'documentSummary.reconciliation.top10PlantNote (with balance)',
    () => UI_STRINGS.documentSummary.reconciliation.top10PlantNote(10, 30, 'SHOWN-SPEND', 'TOTAL-SPEND', '33.3', 20, 'BALANCE-SPEND', '66.7'),
    ['10', '30', 'SHOWN-SPEND', 'TOTAL-SPEND', '33.3', '20', 'BALANCE-SPEND', '66.7']
  ],
  [
    'documentSummary.reconciliation.top10PlantNote (no balance)',
    () => UI_STRINGS.documentSummary.reconciliation.top10PlantNote(10, 10, 'SHOWN-SPEND', 'TOTAL-SPEND', '100'),
    ['10', 'SHOWN-SPEND', 'TOTAL-SPEND']
  ],
  ['documentSummary.reconciliation.allPlantNote', () => UI_STRINGS.documentSummary.reconciliation.allPlantNote(12, 'TOTAL-SPEND'), ['12', 'TOTAL-SPEND']],
  ['documentSummary.reconciliation.top10MgNote', () => UI_STRINGS.documentSummary.reconciliation.top10MgNote(5, 40, 'SHOWN-SPEND', 'TOTAL-SPEND', '60.5'), ['5', '40', 'SHOWN-SPEND', 'TOTAL-SPEND', '60.5']],
  ['documentSummary.reconciliation.allMgNote', () => UI_STRINGS.documentSummary.reconciliation.allMgNote(40, 'TOTAL-SPEND'), ['40', 'TOTAL-SPEND']],
  ['documentSummary.reconciliation.balanceRowLabel', () => UI_STRINGS.documentSummary.reconciliation.balanceRowLabel(7), ['7']],
  ['documentSummary.reconciliation.balanceMgRowLabel', () => UI_STRINGS.documentSummary.reconciliation.balanceMgRowLabel(9), ['9']],
  ['documentSummary.reconciliation.balanceDesc', () => UI_STRINGS.documentSummary.reconciliation.balanceDesc(7), ['7']],
  ['documentSummary.reconciliation.balanceMgDesc', () => UI_STRINGS.documentSummary.reconciliation.balanceMgDesc(9), ['9']],
  ['documentSummary.reconciliation.grandTotalDesc', () => UI_STRINGS.documentSummary.reconciliation.grandTotalDesc(7), ['7']],
  ['documentSummary.reconciliation.grandTotalMgDesc', () => UI_STRINGS.documentSummary.reconciliation.grandTotalMgDesc(9), ['9']],

  ['documentSummary.materialGroup.headers.spend', () => UI_STRINGS.documentSummary.materialGroup.headers.spend('INR'), ['INR']],
  ['documentSummary.materialGroup.headers.trendSingleFy', () => UI_STRINGS.documentSummary.materialGroup.headers.trendSingleFy('FY2024-25'), ['FY2024-25']],
  ['documentSummary.plant.headers.spend', () => UI_STRINGS.documentSummary.plant.headers.spend('USD'), ['USD']],
  ['documentSummary.month.allMonthsFilter', () => UI_STRINGS.documentSummary.month.allMonthsFilter(14), ['14']],
  ['documentSummary.month.actualTrendSubtitle', () => UI_STRINGS.documentSummary.month.actualTrendSubtitle(14), ['14']],
  ['documentSummary.month.actualCoverageLabel', () => UI_STRINGS.documentSummary.month.actualCoverageLabel('Apr 2024 - Mar 2026', 24), ['Apr 2024 - Mar 2026', '24']],
  ['documentSummary.month.fiscalLabel (default total)', () => UI_STRINGS.documentSummary.month.fiscalLabel('FY2024-25', 9), ['FY2024-25', '9', '12']],
  ['documentSummary.month.fiscalLabel (explicit total)', () => UI_STRINGS.documentSummary.month.fiscalLabel('FY2025-26', 4, 6), ['FY2025-26', '4', '6']],
  ['documentSummary.month.coverageDisclosure', () => UI_STRINGS.documentSummary.month.coverageDisclosure(14, 'Apr 2024 - Jun 2025', 2, 'FY2024-25'), ['14', 'Apr 2024 - Jun 2025', '2', 'FY2024-25']],
  ['documentSummary.month.datasetCoverageValue', () => UI_STRINGS.documentSummary.month.datasetCoverageValue(24), ['24']],
  ['documentSummary.month.headers.spend', () => UI_STRINGS.documentSummary.month.headers.spend('INR'), ['INR']],

  ['documentSummary.month.graph.actualTrendSubtitle', () => UI_STRINGS.documentSummary.month.graph.actualTrendSubtitle(14), ['14']],
  ['documentSummary.month.graph.performanceTitle', () => UI_STRINGS.documentSummary.month.graph.performanceTitle('Mar 2026'), ['Mar 2026']],
  ['documentSummary.month.graph.momSuffix (rise)', () => UI_STRINGS.documentSummary.month.graph.momSuffix(4.2), ['+4.2%']],
  ['documentSummary.month.graph.momSuffix (fall)', () => UI_STRINGS.documentSummary.month.graph.momSuffix(-3.1), ['-3.1%']],
  ['documentSummary.month.graph.acrossMonths', () => UI_STRINGS.documentSummary.month.graph.acrossMonths(12), ['12']],
  ['documentSummary.month.graph.actualLineGraphSubtitle', () => UI_STRINGS.documentSummary.month.graph.actualLineGraphSubtitle(12), ['12']],
  ['documentSummary.month.graph.yAxisLabel', () => UI_STRINGS.documentSummary.month.graph.yAxisLabel('INR'), ['INR']],
  ['documentSummary.month.graph.yoyComparisonTitle', () => UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle('Mar 2026'), ['Mar 2026']],
  ['documentSummary.month.graph.yoyGrowth (growth)', () => UI_STRINGS.documentSummary.month.graph.yoyGrowth(12.34), ['+12.3%']],
  ['documentSummary.month.graph.yoyGrowth (decline)', () => UI_STRINGS.documentSummary.month.graph.yoyGrowth(-5.6), ['-5.6%']],
  ['documentSummary.footerValidation', () => UI_STRINGS.documentSummary.footerValidation(512), ['512']],

  ['module2.industryContext.calibratedFor', () => UI_STRINGS.module2.industryContext.calibratedFor('Automotive', 'Tier-1 Suppliers'), ['Automotive', 'Tier-1 Suppliers']],
  ['module2.industryContext.sectorBenchmarkPill', () => UI_STRINGS.module2.industryContext.sectorBenchmarkPill(60, 25), ['60', '25']],
  ['module2.breakdown.activeVendorsCount', () => UI_STRINGS.module2.breakdown.activeVendorsCount(14), ['14']],
  ['module2.breakdown.hideBalanceCategories', () => UI_STRINGS.module2.breakdown.hideBalanceCategories(3), ['3']],
  ['module2.breakdown.viewBalanceCategories', () => UI_STRINGS.module2.breakdown.viewBalanceCategories(4), ['4']],
  ['module2.breakdown.hideBalanceSuppliers', () => UI_STRINGS.module2.breakdown.hideBalanceSuppliers(8), ['8']],
  ['module2.breakdown.viewBalanceSuppliers', () => UI_STRINGS.module2.breakdown.viewBalanceSuppliers(9), ['9']],
  ['module2.totalEvaluated', () => UI_STRINGS.module2.totalEvaluated(1234.5), ['1234.50']],
  ['savingsInitiativesSummary.spendEligibilityExplanation', () => UI_STRINGS.savingsInitiativesSummary.spendEligibilityExplanation(315.02, 25.12), ['315.02', '25.12']],
  ['module2.vendorSupply.itemsModalTitle', () => UI_STRINGS.module2.vendorSupply.itemsModalTitle('Acme Corp'), ['Acme Corp']],
  ['module2.vendorSupply.itemCountBadge', () => UI_STRINGS.module2.vendorSupply.itemCountBadge(12), ['12']],
  ['module2.colLPrefix', () => UI_STRINGS.module2.colLPrefix('C-41'), ['C-41']],
  ['module2.strategicVendorRisk.tabs.badgeCount', () => UI_STRINGS.module2.strategicVendorRisk.tabs.badgeCount(6), ['6']],
  ['module2.strategicVendorRisk.card.spendCr', () => UI_STRINGS.module2.strategicVendorRisk.card.spendCr(12.5), ['12.50']],
  ['module2.strategicVendorRisk.card.sharePct', () => UI_STRINGS.module2.strategicVendorRisk.card.sharePct(33.333), ['33.3']],
  ['module2.strategicVendorRisk.card.secondaryAlertBadge', () => UI_STRINGS.module2.strategicVendorRisk.card.secondaryAlertBadge(4.56), ['4.6']],
  ['module2.segmentCodeLabel', () => UI_STRINGS.module2.segmentCodeLabel('SEG-07'), ['SEG-07']],

  ['module3.indexChangeLabel', () => UI_STRINGS.module3.indexChangeLabel('+2.4%'), ['+2.4%']],
  ['module3.creepAnomalyBadge', () => UI_STRINGS.module3.creepAnomalyBadge(5), ['5.0']],
  ['module3.filterCreepAnomaly', () => UI_STRINGS.module3.filterCreepAnomaly(4), ['4']],
  ['module3.filterAligned', () => UI_STRINGS.module3.filterAligned(9), ['9']],
  ['module3.highCreepVendorCount', () => UI_STRINGS.module3.highCreepVendorCount(3), ['3']],
  ['module3.highCreepLeakage (flagged)', () => UI_STRINGS.module3.highCreepLeakage(37.5), ['37.50']],
  ['module3.filterAllVendors', () => UI_STRINGS.module3.filterAllVendors(20), ['20']],

  ['module4.historicalProcurementNote', () => UI_STRINGS.module4.historicalProcurementNote(1234.567), ['1234.57']],
  ['module4.targetPrefix', () => UI_STRINGS.module4.targetPrefix('18.5%'), ['18.5%']],
  ['module4.leakPrefix', () => UI_STRINGS.module4.leakPrefix('2.1 Cr'), ['2.1 Cr']],
  ['module4.realizationTargetBenchmarkBadge', () => UI_STRINGS.module4.realizationTargetBenchmarkBadge('12'), ['12']],
  ['module4.targetBenchmarkBadge', () => UI_STRINGS.module4.targetBenchmarkBadge('15'), ['15']],
  ['module4.evaluatedBaselineSpendNote', () => UI_STRINGS.module4.evaluatedBaselineSpendNote('245.67'), ['245.67']],

  ['savingsInitiativesSummary.grandTotalSpendNote', () => UI_STRINGS.savingsInitiativesSummary.grandTotalSpendNote(5920.35), ['5920.35']],
  ['savingsInitiativesSummary.overallSavingsPctLabel', () => UI_STRINGS.savingsInitiativesSummary.overallSavingsPctLabel(16.4), ['16.4']],
  ['savingsInitiativesSummary.initiativesTrackedBadge', () => UI_STRINGS.savingsInitiativesSummary.initiativesTrackedBadge(9), ['9']],

  ['modals.clientSetup.spendFormatted', () => UI_STRINGS.modals.clientSetup.spendFormatted(12.3), ['12.30']],
  ['modals.clientSetup.industrySector.directSplit', () => UI_STRINGS.modals.clientSetup.industrySector.directSplit(60), ['60']],
  ['modals.clientSetup.industrySector.packagingSplit', () => UI_STRINGS.modals.clientSetup.industrySector.packagingSplit(20), ['20']],
  ['modals.clientSetup.industrySector.logisticsSplit', () => UI_STRINGS.modals.clientSetup.industrySector.logisticsSplit(10), ['10']],
  ['modals.clientSetup.industrySector.mroSplit', () => UI_STRINGS.modals.clientSetup.industrySector.mroSplit(7), ['7']],
  ['modals.fixCurrency.asOnDateFromD1', () => UI_STRINGS.modals.fixCurrency.asOnDateFromD1('2025-04-01'), ['2025-04-01']],
  ['modals.reassign.vendorLabel', () => UI_STRINGS.modals.reassign.vendorLabel('Tata Steel'), ['Tata Steel']],
  ['modals.reassign.spendLabel', () => UI_STRINGS.modals.reassign.spendLabel('12.5 Cr'), ['12.5 Cr']],
  ['modals.reassign.hierarchyPath', () => UI_STRINGS.modals.reassign.hierarchyPath('Direct', 'Steel', 'Flat Products'), ['Direct', 'Steel', 'Flat Products']],
  ['modals.unspscDetail.digitBreakdownDesc', () => UI_STRINGS.modals.unspscDetail.digitBreakdownDesc('Seg', 'Fam', 'Cls', 'Com'), ['Seg', 'Fam', 'Cls', 'Com']],

  ['modals.topItems.categoryTitle (no period)', () => UI_STRINGS.modals.topItems.categoryTitle('Packaging'), ['Packaging']],
  ['modals.topItems.categoryTitle (with period)', () => UI_STRINGS.modals.topItems.categoryTitle('Packaging', 'FY2024-25'), ['Packaging', 'FY2024-25']],
  ['modals.topItems.vendorTitle (no period)', () => UI_STRINGS.modals.topItems.vendorTitle('Amcor'), ['Amcor']],
  ['modals.topItems.vendorTitle (with period)', () => UI_STRINGS.modals.topItems.vendorTitle('Amcor', 'FY2024-25'), ['Amcor', 'FY2024-25']],
  ['modals.topItems.categoryRank', () => UI_STRINGS.modals.topItems.categoryRank(2), ['2']],
  ['modals.topItems.vendorRank', () => UI_STRINGS.modals.topItems.vendorRank(5), ['5']],
  ['modals.topItems.unspscCommodity', () => UI_STRINGS.modals.topItems.unspscCommodity('11101500'), ['11101500']],
  ['modals.topItems.masterVendorId', () => UI_STRINGS.modals.topItems.masterVendorId('MST-99'), ['MST-99']],
  ['modals.topItems.spendShare', () => UI_STRINGS.modals.topItems.spendShare('42.5'), ['42.5']],
  ['modals.topItems.spendShareVendor', () => UI_STRINGS.modals.topItems.spendShareVendor('42.5'), ['42.5']],
  ['modals.topItems.vendorFiscalYearNote', () => UI_STRINGS.modals.topItems.vendorFiscalYearNote('Packaging', '24101500'), ['Packaging', '24101500']],
  ['modals.topItems.itemsCount', () => UI_STRINGS.modals.topItems.itemsCount(7), ['7']],
  ['modals.topItems.lineItemsCount', () => UI_STRINGS.modals.topItems.lineItemsCount(842), ['842']],
  ['modals.topItems.activeItemsCount', () => UI_STRINGS.modals.topItems.activeItemsCount(321), ['321']],
  ['modals.topItems.unspscColL', () => UI_STRINGS.modals.topItems.unspscColL('24101500'), ['24101500']],
  ['modals.topItems.lakhsVal', () => UI_STRINGS.modals.topItems.lakhsVal(45), ['45']],
  ['modals.topItems.showingCategoryItems', () => UI_STRINGS.modals.topItems.showingCategoryItems(5, 20, 'Packaging'), ['5', '20', 'Packaging']],
  ['modals.topItems.showingVendorItems', () => UI_STRINGS.modals.topItems.showingVendorItems(5, 20, 'Amcor'), ['5', '20', 'Amcor']],

  ['modals.proCPX.deployedDesc', () => UI_STRINGS.modals.proCPX.deployedDesc, ['D1', 'No sourcing event', 'no suppliers']],
  ['modals.proCPX.supplierCohortLabel', () => UI_STRINGS.modals.proCPX.supplierCohortLabel(8), ['8']],
  ['modals.dpsNXT.deployedDesc', () => UI_STRINGS.modals.dpsNXT.deployedDesc, ['D1', 'not active', 'contract']],
  ['modals.report.totalAnalyzedSpendVal', () => UI_STRINGS.modals.report.totalAnalyzedSpendVal(5920.35), ['5920.35']],
  ['modals.report.totalSavingsVal', () => UI_STRINGS.modals.report.totalSavingsVal(78.72), ['78.72']],
  ['modals.report.savingsTargetVal', () => UI_STRINGS.modals.report.savingsTargetVal(14.2), ['14.20']],

  ['toasts.pushedToProCPX', () => UI_STRINGS.toasts.pushedToProCPX('OPP-12'), ['OPP-12', 'D1', 'No external event']],
  ['toasts.deployedToDPSNXT', () => UI_STRINGS.toasts.deployedToDPSNXT('OPP-12'), ['OPP-12', 'D1', 'No rate rules']],
  ['toasts.recordNormalized', () => UI_STRINGS.toasts.recordNormalized('REC-1', 'USD'), ['REC-1', 'USD']],
  ['toasts.recordMapped', () => UI_STRINGS.toasts.recordMapped('REC-2', 'MST-5'), ['REC-2', 'MST-5']],
  ['toasts.recordItemMerged', () => UI_STRINGS.toasts.recordItemMerged('REC-3', 'ITM-9'), ['REC-3', 'ITM-9']],
  ['toasts.blanketFixesApplied (singular)', () => UI_STRINGS.toasts.blanketFixesApplied(1), ['1 validation record']],
  ['toasts.blanketFixesApplied (plural)', () => UI_STRINGS.toasts.blanketFixesApplied(2), ['2 validation records']],
  ['toasts.batchUploadSpend', () => UI_STRINGS.toasts.batchUploadSpend('data.xlsx', 12.5, 850), ['data.xlsx', '12.50', '850']],
  ['toasts.unspscConfirmed', () => UI_STRINGS.toasts.unspscConfirmed('MAP-3'), ['MAP-3']],
  ['toasts.taxonomyReassigned', () => UI_STRINGS.toasts.taxonomyReassigned('24101500', 'Direct'), ['24101500', 'Direct']],
  ['toasts.clientConfigUpdated', () => UI_STRINGS.toasts.clientConfigUpdated('Acme'), ['Acme']],
  ['toasts.navigatingToInitiativeSection', () => UI_STRINGS.toasts.navigatingToInitiativeSection('Savings Register'), ['Savings Register']],

  ['presentation.slideOf', () => UI_STRINGS.presentation.slideOf(3, 9), ['3', '9']],
  ['admin.tierUpdateSuccess', () => UI_STRINGS.admin.tierUpdateSuccess('Acme', 'GOLD'), ['Acme', 'GOLD']],
  ['subscription.tierBadge', () => UI_STRINGS.subscription.tierBadge('GOLD'), ['GOLD']],
  ['subscription.stageMaskedTitle', () => UI_STRINGS.subscription.stageMaskedTitle('Module 2'), ['Module 2']],
  ['subscription.simulationActive', () => UI_STRINGS.subscription.simulationActive('SILVER'), ['SILVER']],
  ['pcbiAdmin.blockingErrorsCount', () => UI_STRINGS.pcbiAdmin.blockingErrorsCount(3), ['3']],
  ['pcbiAdmin.warningsCount', () => UI_STRINGS.pcbiAdmin.warningsCount(2), ['2']],
  ['pcbiAdmin.publishVersionButton', () => UI_STRINGS.pcbiAdmin.publishVersionButton('v2.1'), ['v2.1']],
  ['pcbiAdmin.gapAlertTitle', () => UI_STRINGS.pcbiAdmin.gapAlertTitle('Ferrous Scrap'), ['Ferrous Scrap']],

  ['module2DirectPrice.drilldownCategoryTitle', () => UI_STRINGS.module2DirectPrice.drilldownCategoryTitle('Packaging'), ['Packaging']],
  ['module2EAuction.categoryDrilldownTitle', () => UI_STRINGS.module2EAuction.categoryDrilldownTitle('Packaging'), ['Packaging']],
  ['module2EAuction.materialEvidenceTitle', () => UI_STRINGS.module2EAuction.materialEvidenceTitle('MAT-1'), ['MAT-1']],

  ['module2VendorConsolidation.breadcrumbSupplier', () => UI_STRINGS.module2VendorConsolidation.breadcrumbSupplier('Packaging'), ['Packaging']],
  ['module2VendorConsolidation.breadcrumbMaterial', () => UI_STRINGS.module2VendorConsolidation.breadcrumbMaterial('MAT-1'), ['MAT-1']],
  ['module2VendorConsolidation.categoryDrilldownTitle', () => UI_STRINGS.module2VendorConsolidation.categoryDrilldownTitle('Packaging'), ['Packaging']],
  ['module2VendorConsolidation.materialDrilldownTitle', () => UI_STRINGS.module2VendorConsolidation.materialDrilldownTitle('Packaging'), ['Packaging']],
  ['module2VendorConsolidation.transactionDrilldownTitle', () => UI_STRINGS.module2VendorConsolidation.transactionDrilldownTitle('MAT-1'), ['MAT-1']],
  ['module2VendorConsolidation.formatCrore', () => UI_STRINGS.module2VendorConsolidation.formatCrore('12.50'), ['12.50']],
  ['module2VendorConsolidation.formatRupees', () => UI_STRINGS.module2VendorConsolidation.formatRupees('5,000'), ['5,000']],
  ['module2VendorConsolidation.formatPercent', () => UI_STRINGS.module2VendorConsolidation.formatPercent('12.5'), ['12.5']],
  ['module2VendorConsolidation.formatPriceRange', () => UI_STRINGS.module2VendorConsolidation.formatPriceRange('100', '200'), ['100', '200']],
  ['module2VendorConsolidation.breadcrumbTrail', () => UI_STRINGS.module2VendorConsolidation.breadcrumbTrail('Packaging', 'Materials'), ['Packaging', 'Materials']],
  ['module2VendorConsolidation.tailSupplierBadge', () => UI_STRINGS.module2VendorConsolidation.tailSupplierBadge(5), ['5']],
  ['module2VendorConsolidation.kpiSpendShare', () => UI_STRINGS.module2VendorConsolidation.kpiSpendShare(42.5), ['42.5']],
  ['module2VendorConsolidation.kpiMaterialsOfTotal', () => UI_STRINGS.module2VendorConsolidation.kpiMaterialsOfTotal(12, 42.5), ['12', '42.5']],
  ['module2VendorConsolidation.kpiMaterialsShare', () => UI_STRINGS.module2VendorConsolidation.kpiMaterialsShare(12, 42.5), ['12', '42.5']],
  ['module2VendorConsolidation.kpiMultiSourcedItems', () => UI_STRINGS.module2VendorConsolidation.kpiMultiSourcedItems(9), ['9']],
  ['module2VendorConsolidation.kpiMultiVendorCategories', () => UI_STRINGS.module2VendorConsolidation.kpiMultiVendorCategories(4), ['4']],
  ['module2VendorConsolidation.subTabSameMaterial', () => UI_STRINGS.module2VendorConsolidation.subTabSameMaterial(3), ['3']],
  ['module2VendorConsolidation.subTabComparable', () => UI_STRINGS.module2VendorConsolidation.subTabComparable(4), ['4']],
  ['module2VendorConsolidation.subTabCrossPlant', () => UI_STRINGS.module2VendorConsolidation.subTabCrossPlant(5), ['5']],
  ['module2VendorConsolidation.comparableGroupHeading', () => UI_STRINGS.module2VendorConsolidation.comparableGroupHeading('GRP-1', 'Steel Pipes'), ['GRP-1', 'Steel Pipes']],
  ['module2VendorConsolidation.crossPlantHeading', () => UI_STRINGS.module2VendorConsolidation.crossPlantHeading('MAT-9', 'Valve Body'), ['MAT-9', 'Valve Body']],
  ['module2VendorConsolidation.crossPlantDetail', () => UI_STRINGS.module2VendorConsolidation.crossPlantDetail('P1, P2', 'Central'), ['P1, P2', 'Central']],
  ['module2VendorConsolidation.mappingQueuePendingCount', () => UI_STRINGS.module2VendorConsolidation.mappingQueuePendingCount(12), ['12']],
  ['module2VendorConsolidation.mappingQueueTruncationNotice', () => UI_STRINGS.module2VendorConsolidation.mappingQueueTruncationNotice(50, 120), ['50', '120']],
  ['module2VendorConsolidation.mappingApproveFailedHttp', () => UI_STRINGS.module2VendorConsolidation.mappingApproveFailedHttp('MAT-5', 409), ['MAT-5', '409']],
  ['module2VendorConsolidation.mappingApproveFailedNetwork', () => UI_STRINGS.module2VendorConsolidation.mappingApproveFailedNetwork('MAT-5', 'timeout'), ['MAT-5', 'timeout']],
  ['module2VendorConsolidation.transactionSubtitle', () => UI_STRINGS.module2VendorConsolidation.transactionSubtitle('Steel Pipes', 15), ['Steel Pipes', '15']],

  ['executiveBriefPage.downloadFilename', () => UI_STRINGS.executiveBriefPage.downloadFilename('Acme', 'pdf'), ['Acme', 'pdf']],
  ['executiveBriefPage.footer.copyright', () => UI_STRINGS.executiveBriefPage.footer.copyright(2026), ['2026']],
  ['executiveBriefPage.regenerate.unauthorized', () => UI_STRINGS.executiveBriefPage.regenerate.unauthorized('Session expired', 'req-1'), ['Session expired', 'req-1']],
  ['executiveBriefPage.regenerate.forbidden', () => UI_STRINGS.executiveBriefPage.regenerate.forbidden('Not an admin', 'req-2'), ['Not an admin', 'req-2']],
  ['executiveBriefPage.regenerate.conflict', () => UI_STRINGS.executiveBriefPage.regenerate.conflict('Mismatch', 'req-3'), ['Mismatch', 'req-3']],
  ['executiveBriefPage.regenerate.unavailable', () => UI_STRINGS.executiveBriefPage.regenerate.unavailable('Missing binding', 'req-4'), ['Missing binding', 'req-4']],
  ['executiveBriefPage.regenerate.failed', () => UI_STRINGS.executiveBriefPage.regenerate.failed(500, 'Boom', 'req-5'), ['500', 'Boom', 'req-5']],
  ['executiveBriefPage.regenerate.networkFailed', () => UI_STRINGS.executiveBriefPage.regenerate.networkFailed('offline'), ['offline']],

  ['opportunityBrief.slideCounter', () => UI_STRINGS.opportunityBrief.slideCounter(2, 5), ['2', '5']],
  ['opportunityBrief.slidePage', () => UI_STRINGS.opportunityBrief.slidePage(2, 5), ['2', '5']],
  ['opportunityBrief.downloadFailed', () => UI_STRINGS.opportunityBrief.downloadFailed('PDF', 500, 'req-9'), ['PDF', '500', 'req-9']],
  ['opportunityBrief.downloadNetworkFailed', () => UI_STRINGS.opportunityBrief.downloadNetworkFailed('PDF'), ['PDF']],

  ['orchestration.elapsedHoursOfSla', () => UI_STRINGS.orchestration.elapsedHoursOfSla(30, 48), ['30', '48']],
  ['orchestration.excludedReason', () => UI_STRINGS.orchestration.excludedReason('Duplicate'), ['Duplicate']],
  ['orchestration.dataVersionChangeTitle', () => UI_STRINGS.orchestration.dataVersionChangeTitle('v1', 'v2'), ['v1', 'v2']],
  ['orchestration.auditDataUploaded', () => UI_STRINGS.orchestration.auditDataUploaded('TEN-1', 'VER-1'), ['TEN-1', 'VER-1']],
  ['orchestration.auditModule1Completed', () => UI_STRINGS.orchestration.auditModule1Completed('12.5'), ['12.5']],
  ['orchestration.auditAnalysisQueued', () => UI_STRINGS.orchestration.auditAnalysisQueued('QUEUED'), ['QUEUED']],
  ['orchestration.auditReportGenerated', () => UI_STRINGS.orchestration.auditReportGenerated('VER-2'), ['VER-2']],
  ['orchestration.auditReportSubmitted', () => UI_STRINGS.orchestration.auditReportSubmitted('cfo@acme.com'), ['cfo@acme.com']],
  ['orchestration.auditReportAcknowledged', () => UI_STRINGS.orchestration.auditReportAcknowledged('2026-01-01T00:00:00Z'), ['2026-01-01T00:00:00Z']],
  ['orchestration.gapResolvedSuccess', () => UI_STRINGS.orchestration.gapResolvedSuccess('MISSING'), ['MISSING']],
  ['orchestration.errorLoadControlCenter', () => UI_STRINGS.orchestration.errorLoadControlCenter('timeout'), ['timeout']],
  ['orchestration.errorLoadWorkspace', () => UI_STRINGS.orchestration.errorLoadWorkspace('404'), ['404']],
  ['orchestration.errorResolveGap', () => UI_STRINGS.orchestration.errorResolveGap('bad id'), ['bad id']],
  ['orchestration.errorUploadCorrected', () => UI_STRINGS.orchestration.errorUploadCorrected('bad file'), ['bad file']],
  ['orchestration.errorGenerateReport', () => UI_STRINGS.orchestration.errorGenerateReport('incomplete'), ['incomplete']],
  ['orchestration.errorConfirmChecklist', () => UI_STRINGS.orchestration.errorConfirmChecklist('unchecked'), ['unchecked']],
  ['orchestration.errorApproveReport', () => UI_STRINGS.orchestration.errorApproveReport('not confirmed'), ['not confirmed']],
  ['orchestration.errorResendNotification', () => UI_STRINGS.orchestration.errorResendNotification('rate limit'), ['rate limit']],
  ['orchestration.errorSupersedeReport', () => UI_STRINGS.orchestration.errorSupersedeReport('no reason'), ['no reason']],
  ['orchestration.datasetDownloadStarted', () => UI_STRINGS.orchestration.datasetDownloadStarted('Spend_Data.xlsx'), ['Spend_Data.xlsx']],
  ['orchestration.datasetDownloadHttpFailure', () => UI_STRINGS.orchestration.datasetDownloadHttpFailure('Spend_Data.xlsx', 503, 'R2 unavailable', 'req-12'), ['Spend_Data.xlsx', '503', 'R2 unavailable', 'req-12']],
  ['orchestration.datasetDownloadNetworkFailure', () => UI_STRINGS.orchestration.datasetDownloadNetworkFailure('Spend_Data.xlsx', 'offline'), ['Spend_Data.xlsx', 'offline']],
  ['orchestration.datasetDownloadResponseFailure', () => UI_STRINGS.orchestration.datasetDownloadResponseFailure('Spend_Data.xlsx'), ['Spend_Data.xlsx']],
  ['orchestration.errorDownloadDataset', () => UI_STRINGS.orchestration.errorDownloadDataset('R2 unavailable'), ['R2 unavailable']],

  ['evidence.savingsTypes.canonicalTypesCount', () => UI_STRINGS.evidence.savingsTypes.canonicalTypesCount(4), ['4']],
  ['evidence.savingsTypes.sheetCount', () => UI_STRINGS.evidence.savingsTypes.sheetCount(3), ['3']],
  ['evidence.downloadFailure.httpFailure', () => UI_STRINGS.evidence.downloadFailure.httpFailure('evidence.xlsx', 500, 'Server error', 'req-6'), ['evidence.xlsx', '500', 'Server error', 'req-6']],
  ['evidence.downloadFailure.networkFailure', () => UI_STRINGS.evidence.downloadFailure.networkFailure('evidence.xlsx', 'timeout'), ['evidence.xlsx', 'timeout']],
  ['evidence.panel.verificationRules', () => UI_STRINGS.evidence.panel.verificationRules(7), ['7']],
  ['evidence.panel.passedOfTotal', () => UI_STRINGS.evidence.panel.passedOfTotal(5, 7), ['5', '7']],
  ['evidence.panel.sheetCount', () => UI_STRINGS.evidence.panel.sheetCount(6), ['6']],

  ['ASSESSMENT.uploadScreen.dateRange', () => UI_STRINGS.ASSESSMENT.uploadScreen.dateRange('01 Apr 2024', '31 Mar 2026'), ['01 Apr 2024', '31 Mar 2026']],
  ['ASSESSMENT.uploadScreen.fileSizeBytes', () => UI_STRINGS.ASSESSMENT.uploadScreen.fileSizeBytes(512), ['512']],
  ['ASSESSMENT.uploadScreen.fileSizeKilobytes', () => UI_STRINGS.ASSESSMENT.uploadScreen.fileSizeKilobytes('12.5'), ['12.5']],
  ['ASSESSMENT.uploadScreen.fileSizeMegabytes', () => UI_STRINGS.ASSESSMENT.uploadScreen.fileSizeMegabytes('3.2'), ['3.2']],
  ['ASSESSMENT.uploadScreen.validationPassed', () => UI_STRINGS.ASSESSMENT.uploadScreen.validationPassed('842', '12', '5'), ['842', '12', '5']],
  ['ASSESSMENT.uploadScreen.validatedSpendValue', () => UI_STRINGS.ASSESSMENT.uploadScreen.validatedSpendValue('613.88'), ['613.88']],
  ['ASSESSMENT.uploadScreen.fileTooLarge', () => UI_STRINGS.ASSESSMENT.uploadScreen.fileTooLarge(25), ['25']],
  ['ASSESSMENT.uploadScreen.uploadFailed', () => UI_STRINGS.ASSESSMENT.uploadScreen.uploadFailed('Network interrupted'), ['Network interrupted']],
  ['ASSESSMENT.uploadScreen.validationFailed', () => UI_STRINGS.ASSESSMENT.uploadScreen.validationFailed('Missing column'), ['Missing column']],
  ['ASSESSMENT.uploadScreen.module1Failed', () => UI_STRINGS.ASSESSMENT.uploadScreen.module1Failed('Schema mismatch'), ['Schema mismatch']],

  ['databaseData.conversionLoadFailed', () => UI_STRINGS.databaseData.conversionLoadFailed(503), ['503']],
  ['header.docRef', () => UI_STRINGS.header.docRef('TEST-REF-123'), ['TEST-REF-123']],
  ['header.authorFormatted', () => UI_STRINGS.header.authorFormatted('Alice', 'Lead Partner'), ['Alice', 'Lead Partner']],
  ['header.currencyTitle', () => UI_STRINGS.header.currencyTitle('USD'), ['USD']],
  ['pipeline.lockedStepRequired', () => UI_STRINGS.pipeline.lockedStepRequired(1, 2), ['1', '2']],
  ['pipeline.currentStage', () => UI_STRINGS.pipeline.currentStage(2, 'Taxonomy'), ['2', 'Taxonomy']],
  ['schema.attributesCount', () => UI_STRINGS.schema.attributesCount(12), ['12']],
  ['module1.postFixValidation.governanceChecksActive', () => UI_STRINGS.module1.postFixValidation.governanceChecksActive(2), ['2']],
  ['module1.summaryCards.totalRecords', () => UI_STRINGS.module1.summaryCards.totalRecords(100), ['100']],
  ['module1.summaryCards.validRecords', () => UI_STRINGS.module1.summaryCards.validRecords(80), ['80']],
  ['module1.summaryCards.flaggedRecords', () => UI_STRINGS.module1.summaryCards.flaggedRecords(20), ['20']],
  ['module1.summaryCards.remediatedPct', () => UI_STRINGS.module1.summaryCards.remediatedPct(95), ['95']],
  ['module2.vendorSupply.alarmObservation', () => UI_STRINGS.module2.vendorSupply.alarmObservation(65.2, 284.6, 15), ['65.2', '284.60', '15']],
  ['module2.vendorSupply.statAffectedVendorsValue', () => UI_STRINGS.module2.vendorSupply.statAffectedVendorsValue(9, 14), ['9', '14']],
  ['module2.vendorSupply.statHighSpendShareValue', () => UI_STRINGS.module2.vendorSupply.statHighSpendShareValue(69.1), ['69.1']],
  ['module2.vendorSupply.statImpactSpendValue', () => UI_STRINGS.module2.vendorSupply.statImpactSpendValue(444.1), ['444.10']],
  ['module2.vendorSupply.statPotentialSavingsValue', () => UI_STRINGS.module2.vendorSupply.statPotentialSavingsValue(37.75), ['37.75']],
  ['module2.vendorSupply.multiShareLabel', () => UI_STRINGS.module2.vendorSupply.multiShareLabel(60, 100), ['60.0', '100.0']],
  ['module2.vendorSupply.singleShareLabel', () => UI_STRINGS.module2.vendorSupply.singleShareLabel(40, 50), ['40.0', '50.0']],
  ['module2.vendorSupply.badgeCategoryCount', () => UI_STRINGS.module2.vendorSupply.badgeCategoryCount(3), ['3']],
  ['module2.vendorSupply.badgeDisparateSupplies', () => UI_STRINGS.module2.vendorSupply.badgeDisparateSupplies(2), ['2']],
  ['module2.vendorSupply.showingVendorsSummary', () => UI_STRINGS.module2.vendorSupply.showingVendorsSummary(20, 50), ['20', '50']],
  ['module2.unspscCodeBadge', () => UI_STRINGS.module2.unspscCodeBadge('11101234'), ['11101234']],
  ['module2.confidenceScore', () => UI_STRINGS.module2.confidenceScore(92), ['92']],
  ['module3.volatilityIndex', () => UI_STRINGS.module3.volatilityIndex(4), ['4']],
  ['module3.priceCreepPct', () => UI_STRINGS.module3.priceCreepPct(12.5), ['12.5']],
  ['module3.leakageAmount', () => UI_STRINGS.module3.leakageAmount('4.2 Cr'), ['4.2 Cr']],
  ['module4.opportunitiesCount', () => UI_STRINGS.module4.opportunitiesCount(7), ['7']],
  ['module4.overlapDeduplication.netSavingsSummary', () => UI_STRINGS.module4.overlapDeduplication.netSavingsSummary(10.5, 12.3, 1.8), ['10.50', '12.30', '1.80']],
  ['module5.annualSpendVal', () => UI_STRINGS.module5.annualSpendVal(100), ['100.00']],
  ['module5.savingsRateVal', () => UI_STRINGS.module5.savingsRateVal(16.4), ['16.4']],
  ['module5.platformFeeVal', () => UI_STRINGS.module5.platformFeeVal(2.5, 15), ['2.50', '15.00']],
  ['module5.grossSavingsCrVal', () => UI_STRINGS.module5.grossSavingsCrVal(50), ['50.00']],
  ['module5.netBenefitCrVal', () => UI_STRINGS.module5.netBenefitCrVal(45), ['45.00']],
  ['module5.roiMultipleVal', () => UI_STRINGS.module5.roiMultipleVal(6), ['6.0']],
  ['module5.paybackMonthsVal', () => UI_STRINGS.module5.paybackMonthsVal(2.3), ['2.3']],
  ['modals.dpsNXT.qualifiedBiddersCount', () => UI_STRINGS.modals.dpsNXT.qualifiedBiddersCount(6), ['6']],
  ['toasts.issueIgnored', () => UI_STRINGS.toasts.issueIgnored('REC-8841'), ['REC-8841']],
  ['errors.validation.requiredField', () => UI_STRINGS.errors.validation.requiredField('email'), ['email']],
  ['errors.validation.invalidFormat', () => UI_STRINGS.errors.validation.invalidFormat('phone', '+1-xxx-xxx-xxxx'), ['phone', '+1-xxx-xxx-xxxx']],
  ['errors.validation.outOfRange', () => UI_STRINGS.errors.validation.outOfRange('age', 18, 65), ['age', '18', '65']],
  ['errors.network.timeout', () => UI_STRINGS.errors.network.timeout('Upload', 5000), ['Upload', '5000']],
  ['errors.network.unreachable', () => UI_STRINGS.errors.network.unreachable('FX API'), ['FX API']],
  ['errors.auth.insufficientPermissions', () => UI_STRINGS.errors.auth.insufficientPermissions('Viewer', 'Admin'), ['Viewer', 'Admin']],
  ['errors.auth.tenantAccessDenied', () => UI_STRINGS.errors.auth.tenantAccessDenied('tenant-99'), ['tenant-99']],
  ['errors.notFound.entityNotFound', () => UI_STRINGS.errors.notFound.entityNotFound('Supplier', 'SUP-999'), ['Supplier', 'SUP-999']],
  ['errors.conflict.duplicateEntity', () => UI_STRINGS.errors.conflict.duplicateEntity('Vendor', 'DHL'), ['Vendor', 'DHL']],
  ['errors.server.internalError', () => UI_STRINGS.errors.server.internalError(500, 'req-abc-123'), ['500', 'req-abc-123']],
  ['errors.rateLimit.throttled', () => UI_STRINGS.errors.rateLimit.throttled(30), ['30']],
  ['vendorConsolidation.kpiActiveVendorsSub', () => UI_STRINGS.vendorConsolidation.kpiActiveVendorsSub(7.8), ['7.8']],
  ['vendorConsolidation.kpiVolumeSavingsSub', () => UI_STRINGS.vendorConsolidation.kpiVolumeSavingsSub(14.5), ['14.5']],
  ['vendorConsolidation.showingItemsCount', () => UI_STRINGS.vendorConsolidation.showingItemsCount(6, 6), ['6']],
  ['vendorConsolidation.vendorCountBadge', () => UI_STRINGS.vendorConsolidation.vendorCountBadge(8), ['8']],
  ['vendorConsolidation.monthlyPoBadge', () => UI_STRINGS.vendorConsolidation.monthlyPoBadge(42), ['42']],
  ['vendorConsolidation.priceVarianceValue', () => UI_STRINGS.vendorConsolidation.priceVarianceValue(14.8), ['14.8']],
  ['vendorConsolidation.targetConsolidationValue', () => UI_STRINGS.vendorConsolidation.targetConsolidationValue(2), ['2']],
  ['vendorConsolidation.volumeBenefitValue', () => UI_STRINGS.vendorConsolidation.volumeBenefitValue(5.58, 14.5), ['5.58', '14.5']],
  ['vendorConsolidation.auctionPlatformLabel', () => UI_STRINGS.vendorConsolidation.auctionPlatformLabel('DPS NXT'), ['DPS NXT']],
  ['vendorConsolidation.modalTitle', () => UI_STRINGS.vendorConsolidation.modalTitle('Corrugated Boxes'), ['Corrugated Boxes']],
  ['vendorConsolidation.fragmentationAlertBody', () => UI_STRINGS.vendorConsolidation.fragmentationAlertBody(8, 14.8), ['8', '14.8']],
  ['poConsolidation.kpiTotalCurrentPosSub', () => UI_STRINGS.poConsolidation.kpiTotalCurrentPosSub(6), ['6']],
  ['poConsolidation.kpiTargetPosSub', () => UI_STRINGS.poConsolidation.kpiTargetPosSub(94.2), ['94.2']],
  ['poConsolidation.kpiEconomiesOfScaleSub', () => UI_STRINGS.poConsolidation.kpiEconomiesOfScaleSub(26.5), ['26.5']],
  ['poConsolidation.showingItemsCount', () => UI_STRINGS.poConsolidation.showingItemsCount(6, 6), ['6']],
  ['poConsolidation.monthlyPoBadge', () => UI_STRINGS.poConsolidation.monthlyPoBadge(12), ['12']],
  ['poConsolidation.annualPoBadge', () => UI_STRINGS.poConsolidation.annualPoBadge(144), ['144']],
  ['poConsolidation.avgPoValueVal', () => UI_STRINGS.poConsolidation.avgPoValueVal(44.79), ['44.79']],
  ['poConsolidation.scaleSavingsValue', () => UI_STRINGS.poConsolidation.scaleSavingsValue(10.32, 16), ['10.32', '16.0']],
  ['poConsolidation.adminSavingsValue', () => UI_STRINGS.poConsolidation.adminSavingsValue(5), ['5.0']],
  ['poConsolidation.modalTitle', () => UI_STRINGS.poConsolidation.modalTitle('Jindal Stainless'), ['Jindal Stainless']],
  ['poConsolidation.currentPoFrequencyVal', () => UI_STRINGS.poConsolidation.currentPoFrequencyVal(12, 144), ['12', '144']],
  ['analyzingLoader.metrics.recordsValue', () => UI_STRINGS.analyzingLoader.metrics.recordsValue(842), ['842']],
  ['analyzingLoader.metrics.spendValue', () => UI_STRINGS.analyzingLoader.metrics.spendValue(8066.86), ['8066.86']],
  ['analyzingLoader.metrics.vendorsValue', () => UI_STRINGS.analyzingLoader.metrics.vendorsValue(321), ['321']],
  ['analyzingLoader.metrics.categoriesValue', () => UI_STRINGS.analyzingLoader.metrics.categoriesValue(48), ['48']],
  ['analyzingLoader.metrics.confidenceValue', () => UI_STRINGS.analyzingLoader.metrics.confidenceValue(99.4), ['99.4']],
  ['analyzingLoader.overallProgress', () => UI_STRINGS.analyzingLoader.overallProgress(75), ['75']],
  ['auth.loggedInAs', () => UI_STRINGS.auth.loggedInAs('Rajesh', 'USER'), ['Rajesh', 'USER']],
  ['admin.statusUpdateSuccess', () => UI_STRINGS.admin.statusUpdateSuccess('Alice', 'SUSPENDED'), ['Alice', 'SUSPENDED']],
  ['admin.userCountLabel', () => UI_STRINGS.admin.userCountLabel(15), ['15']],
  ['pcbiCommodityDataLab.workspaceTitle', () => UI_STRINGS.pcbiCommodityDataLab.workspaceTitle('Ferro Moly', 'PCBI-001'), ['Ferro Moly', 'PCBI-001']],
  ['pcbiCommodityDataLab.approvalSuccessNotice', () => UI_STRINGS.pcbiCommodityDataLab.approvalSuccessNotice('V2.0'), ['V2.0']],
  ['ASSESSMENT.customerManagement.selectedCustomerBanner', () => UI_STRINGS.ASSESSMENT.customerManagement.selectedCustomerBanner('Tata Motors', 'CUST-001'), ['Tata Motors', 'CUST-001']],
  ['ASSESSMENT.uploadPipeline.validationPassedSummary', () => UI_STRINGS.ASSESSMENT.uploadPipeline.validationPassedSummary(842, 12, 5), ['842', '12', '5']],
  ['ASSESSMENT.uploadPipeline.module1SuccessSummary', () => UI_STRINGS.ASSESSMENT.uploadPipeline.module1SuccessSummary(613.8805, 842), ['613.8805', '842']],
  ['reportingPeriod.fy.fiscalYearLabel', () => UI_STRINGS.reportingPeriod.fy.fiscalYearLabel('FY2024-25'), ['FY2024-25']],
  ['reportingPeriod.disclosure.insufficientHistoryBody', () => UI_STRINGS.reportingPeriod.disclosure.insufficientHistoryBody(12, 8, 4), ['12', '8', '4']],
  ['reportingPeriod.disclosure.partialFyBody', () => UI_STRINGS.reportingPeriod.disclosure.partialFyBody('FY2024-25', 9, 'Apr-Dec'), ['FY2024-25', '9', 'Apr']],

  ['documentSummary.subheading (missing record count)', () => UI_STRINGS.documentSummary.subheading('report.xlsx', undefined), ['report.xlsx', 'N/A']],
  ['documentSummary.distinctMaterialsCount (missing count)', () => UI_STRINGS.documentSummary.distinctMaterialsCount(undefined), ['0']],
  ['documentSummary.distinctSuppliersCount (missing count)', () => UI_STRINGS.documentSummary.distinctSuppliersCount(undefined), ['0']],
  ['documentSummary.dateRangeValue (label without month count)', () => UI_STRINGS.documentSummary.dateRangeValue(undefined, 'Ingestion Timeframe'), ['Ingestion Timeframe', '0']],
  ['modals.topItems.itemsCount (zero count)', () => UI_STRINGS.modals.topItems.itemsCount(0), ['0']],
  ['modals.topItems.lineItemsCount (missing count)', () => UI_STRINGS.modals.topItems.lineItemsCount(undefined), ['0']],
  ['modals.topItems.activeItemsCount (missing count)', () => UI_STRINGS.modals.topItems.activeItemsCount(undefined), ['0']]
];

describe('UI_STRINGS template formatters', () => {
  it.each(FORMATTER_CASES)('%s renders its runtime parameters', (_path, render, fragments) => {
    expectTextWithFragments(render(), fragments);
  });
});

describe('UI_STRINGS branch-specific helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('includes the server request ID in regeneration failures only when one is returned', () => {
    const withRequestId = UI_STRINGS.executiveBriefPage.regenerate.unauthorized('Session expired', 'req-1');
    const withoutRequestId = UI_STRINGS.executiveBriefPage.regenerate.unauthorized('Session expired', null);

    expect(withRequestId).toContain('req-1');
    expect(withoutRequestId).toContain('Session expired');
    expect(withoutRequestId).not.toContain('req-1');
  });

  it('uses the available-period wording only for twelve months or fewer', () => {
    const shortHistory = UI_STRINGS.documentSummary.dateRangeValue(12);
    const longHistory = UI_STRINGS.documentSummary.dateRangeValue(13);

    expect(shortHistory).toContain('12');
    expect(longHistory).toContain('13');
    expect(shortHistory).not.toBe(longHistory);
  });

  it('reports zero months when no month count is available', () => {
    expect(UI_STRINGS.documentSummary.dateRangeValue()).toContain('0');
    expect(UI_STRINGS.documentSummary.dateRangeValue(0)).toContain('0');
  });

  it('shows balance facilities in the top-10 plant note only when a positive balance count is given', () => {
    const reconciliation = UI_STRINGS.documentSummary.reconciliation;
    const withBalance = reconciliation.top10PlantNote(10, 30, 'SHOWN', 'TOTAL', '33.3', 20, 'BALANCE', '66.7');
    const withoutBalance = reconciliation.top10PlantNote(10, 30, 'SHOWN', 'TOTAL', '33.3');
    const zeroBalance = reconciliation.top10PlantNote(10, 30, 'SHOWN', 'TOTAL', '33.3', 0, 'BALANCE', '0');

    expect(withBalance).toContain('BALANCE');
    expect(withoutBalance).not.toContain('BALANCE');
    expect(zeroBalance).toBe(withoutBalance);
  });

  it('describes leakage only when high-creep anomalies carry value', () => {
    const flagged = UI_STRINGS.module3.highCreepLeakage(37.5);
    const clean = UI_STRINGS.module3.highCreepLeakage(0);

    expect(flagged).toContain('37.50');
    expect(clean).not.toContain('37.50');
    expect(clean).not.toBe(flagged);
  });

  it('adds the period suffix to price-trend titles only when a period is given', () => {
    const topItems = UI_STRINGS.modals.topItems;

    expect(topItems.categoryTitle('Packaging', 'FY2024-25')).toContain('FY2024-25');
    expect(topItems.categoryTitle('Packaging')).not.toContain('FY2024-25');
    expect(topItems.vendorTitle('Amcor', 'FY2024-25')).toContain('FY2024-25');
    expect(topItems.vendorTitle('Amcor')).not.toContain('FY2024-25');
  });

  it('omits the request ID clause from document download failures when none is returned', () => {
    const withRequestId = UI_STRINGS.evidence.downloadFailure.httpFailure('evidence.xlsx', 500, 'Server error', 'req-6');
    const withoutRequestId = UI_STRINGS.evidence.downloadFailure.httpFailure('evidence.xlsx', 500, 'Server error', null);

    expect(withRequestId).toContain('req-6');
    expect(withoutRequestId).not.toContain('req-6');
    expect(withoutRequestId).toContain('Server error');
  });

  it('shows evaluated-spend data as unavailable when the value is missing or zero', () => {
    expect(UI_STRINGS.module2.totalEvaluated(undefined)).toBe(UI_STRINGS.module2.totalEvaluatedUnavailable);
    expect(UI_STRINGS.module2.totalEvaluated(0)).toBe(UI_STRINGS.module2.totalEvaluatedUnavailable);
  });

  it('explains that development sign-in uses registered database accounts', () => {
    expect(UI_STRINGS.auth.developmentAuthNotice).toContain('D1 database');
    expect(UI_STRINGS.auth.developmentAuthNotice).toContain('database-assigned administrator role');
  });

  it('does not publish predefined-account or administrator-bypass labels in production builds', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();

    const { UI_STRINGS: productionStrings } = await import('../../src/constants/uiStrings');

    expect('quickTestLogins' in productionStrings.auth).toBe(false);
    expect('goToAdminDirectly' in productionStrings.auth).toBe(false);
    expect(productionStrings.auth.logout).toBe(UI_STRINGS.auth.logout);
  });
});
