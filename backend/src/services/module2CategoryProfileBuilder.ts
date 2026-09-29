/**
 * Module 2 — Category Sourcing Profile Builder
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { CategoryStrategicSourcingProfile } from '../types/module2StrategicSourcing';
import { MODULE_2_SOURCING_VERSION } from '../constants/module2StrategicSourcing';
import { Module2RecurrenceEngine } from './module2RecurrenceEngine';
import { Module2ComparabilityEngine } from './module2ComparabilityEngine';
import { Module2PriceEngine } from './module2PriceEngine';
import { Module2SupplierStructureBuilder } from './module2SupplierStructureBuilder';
import { Module2OpportunityCalculator } from './module2OpportunityCalculator';
import { Module2ScorecardEngine } from './module2ScorecardEngine';
import { Module2WaterfallBuilder } from './module2WaterfallBuilder';
import { Module2ItemAnalysisEngine } from './module2ItemAnalysisEngine';
import { Module2FragmentationHelper } from './module2FragmentationHelper';
import { Module2CategoryProfileHelper } from './module2CategoryProfileHelper';
import { Module2OpportunityIntelligenceHelper } from './module2OpportunityIntelligenceHelper';

export class Module2CategoryProfileBuilder {
  public static buildProfile(
    categoryName: string,
    transactions: StrategicInputTransaction[]
  ): CategoryStrategicSourcingProfile {
    const totalTxCount = transactions.length;
    const totalSpendInr = Module2CategoryProfileHelper.calculateTotalSpend(transactions);
    const totalSpendInrCr = Module2CategoryProfileHelper.toCr(totalSpendInr);

    const recurrence = Module2RecurrenceEngine.calculateRecurrence(transactions, totalSpendInr);
    const compResult = Module2ComparabilityEngine.evaluateComparability(transactions);
    const comparableTx = compResult.comparableTransactions;
    const addressableSpendInr = compResult.comparableSpendInr;
    const addressableSpendInrCr = Module2CategoryProfileHelper.toCr(addressableSpendInr);
    const addressableQuantity = compResult.comparableQuantity;

    const dispersion = Module2PriceEngine.calculatePriceDispersion(comparableTx);
    const credibleRef = Module2PriceEngine.determineCredibleReferencePrice(comparableTx, dispersion);
    const suppliers = Module2SupplierStructureBuilder.buildSupplierStructure(
      transactions,
      totalSpendInr,
      totalTxCount,
      dispersion
    );

    const { hhiScore, hhiInterpretation, fragmentationLevel, fragmentationRationale } =
      Module2FragmentationHelper.calculateHHIAndFragmentation(suppliers, totalSpendInr);

    const compTxCount = comparableTx.length;
    const { dataConfidence, confidenceRationale } = Module2ComparabilityEngine.evaluateDataConfidence(
      recurrence.activeMonthsCount,
      suppliers.length,
      compTxCount,
      compResult.excludedTransactions.length
    );

    const items = Module2ItemAnalysisEngine.analyzeItems(categoryName, transactions, new Set());
    const volumeBundlingOpp = items.reduce((s, it) => s + (it.volumeBundlingBenefitInr || 0), 0);
    const specialistOpp = items.reduce((s, it) => s + (it.specialistRealignmentBenefitInr || 0), 0);

    const eauctionCalc = Module2OpportunityCalculator.calculateEAuctionBenefit(
      recurrence.isRecurring,
      suppliers.length,
      addressableSpendInr,
      addressableQuantity,
      dispersion,
      credibleRef
    );

    const consolCalc = Module2OpportunityCalculator.calculateConsolidationBenefit(
      recurrence.isRecurring,
      suppliers,
      addressableQuantity,
      dispersion,
      totalTxCount,
      recurrence.activeMonthsCount
    );

    const netCalc = Module2OpportunityCalculator.calculateNetOpportunity(
      eauctionCalc.opportunityInr,
      consolCalc.opportunityInr,
      dataConfidence !== 'INSUFFICIENT',
      compTxCount,
      volumeBundlingOpp,
      specialistOpp
    );

    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(addressableQuantity, dispersion, credibleRef);
    const scorecard = Module2ScorecardEngine.evaluateScorecard({
      materiality: recurrence.categoryMateriality,
      fragmentation: fragmentationLevel,
      dispersion,
      isRecurring: recurrence.isRecurring,
      supplierCount: suppliers.length,
      comparableTxCount: compTxCount,
      totalTxCount,
      addressableSpendInr,
      confidence: dataConfidence
    });

    const levers = Module2ScorecardEngine.buildLeverMatrix({
      addressableSpendInr,
      supplierCount: suppliers.length,
      suppliers,
      dispersion,
      isRecurring: recurrence.isRecurring,
      confidence: dataConfidence,
      eauctionOppInr: eauctionCalc.opportunityInr,
      consolidationOppInr: consolCalc.opportunityInr
    });

    const eauctionOpp = eauctionCalc.opportunityInr ?? 0;
    const consolOpp = consolCalc.opportunityInr ?? 0;
    const overlapOpp = netCalc.overlappingInr;
    const netOpp = netCalc.netInr ?? 0;

    const waterfall = Module2WaterfallBuilder.buildWaterfall(
      totalSpendInr,
      totalSpendInrCr,
      addressableSpendInr,
      addressableSpendInrCr,
      eauctionOpp,
      consolOpp,
      overlapOpp,
      netOpp,
      volumeBundlingOpp,
      specialistOpp
    );

    const grossOpp = eauctionOpp + consolOpp + volumeBundlingOpp + specialistOpp;

    const intel = Module2OpportunityIntelligenceHelper.buildIntelligence({
      categoryName,
      totalSpendInr,
      addressableSpendInr,
      comparableSpendInr: addressableSpendInr,
      addressableQuantity,
      suppliers,
      fragmentationLevel,
      priceDispersion: dispersion,
      isRecurring: recurrence.isRecurring,
      activeMonthsCount: recurrence.activeMonthsCount,
      comparableTxCount: compTxCount,
      totalTxCount,
      confidence: dataConfidence,
      eauctionOppInr: eauctionCalc.opportunityInr,
      consolidationOppInr: consolCalc.opportunityInr,
      volumeBundlingOppInr: volumeBundlingOpp,
      specialistOppInr: specialistOpp,
      overlapOppInr: overlapOpp,
      netOppInr: netCalc.netInr
    });

    const calculationId = `CALC-M2-${categoryName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}-${Date.now()}`;
    const evidenceTransactionIds = comparableTx.map(t => t.id || t.po_number || 'TX').slice(0, 50);
    const classInfo = Module2CategoryProfileHelper.getClassificationInfo(transactions[0], categoryName);
    const fiscalYearSpend = Module2CategoryProfileHelper.buildFiscalYearSpend(
      totalSpendInr,
      items.length,
      suppliers.length,
      recurrence.isRecurring
    );
    const evidenceData = Module2CategoryProfileHelper.enrichEvidenceChain(
      categoryName,
      transactions,
      netCalc.netInr,
      scorecard.justificationNotes[0] || 'Convene sourcing category review with procurement lead.'
    );

    return {
      categoryId: `CAT-${categoryName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)}`,
      categoryName,
      module2Classification: classInfo.classification,
      unspscCode: classInfo.unspscCode,
      unspscFamily: classInfo.unspscFamily,
      totalSpendInr: Math.round(totalSpendInr),
      totalSpendInrCr,
      transactionCount: totalTxCount,
      activeSuppliersCount: suppliers.length,
      activeMonthsCount: recurrence.activeMonthsCount,
      averageMonthlySpendInr: recurrence.avgMonthlySpendInr,
      averageTransactionValueInr: recurrence.avgTxValueInr,
      spendTrend: 'STABLE',
      isRecurringSpend: recurrence.isRecurring,
      recurringRationale: recurrence.recurringRationale,
      categoryMateriality: recurrence.categoryMateriality,

      monthlySpendBreakdown: [],
      orderSizeDistribution: {
        smallOrdersCount: Math.round(totalTxCount * 0.4),
        mediumOrdersCount: Math.round(totalTxCount * 0.4),
        largeOrdersCount: Math.round(totalTxCount * 0.2),
        orderCountRatio: totalTxCount
      },

      suppliers,
      topSupplierSharePct: Math.round((suppliers[0]?.spendSharePct || 0) * 10) / 10,
      top3SupplierSharePct: Math.round(suppliers.slice(0, 3).reduce((sum, s) => sum + s.spendSharePct, 0) * 10) / 10,
      top5SupplierSharePct: Math.round(suppliers.slice(0, 5).reduce((sum, s) => sum + s.spendSharePct, 0) * 10) / 10,
      longTailSupplierSharePct: Math.round(
        suppliers.filter(s => s.isTailSupplier).reduce((sum, s) => sum + s.spendSharePct, 0) * 10
      ) / 10,
      hhiScore,
      hhiInterpretation,
      fragmentationLevel,
      fragmentationRationale,

      comparableTransactionCount: compTxCount,
      excludedTransactionCount: compResult.excludedTransactions.length,
      comparableSpendInr: Math.round(addressableSpendInr),
      comparableQuantity: addressableQuantity,
      addressableSpendInr: Math.round(addressableSpendInr),
      addressableSpendInrCr,
      addressableQuantity,
      priceDispersion: dispersion,
      credibleReference: credibleRef,
      exclusions: compResult.excludedTransactions,

      status: netCalc.status,
      statusLabel: netCalc.statusLabel,
      dataConfidence,
      confidenceRationale,

      eauctionSuitability: eauctionCalc.suitability,
      eauctionSuitabilityRationale: eauctionCalc.rationale,
      potentialEAuctionOpportunityInr: eauctionCalc.opportunityInr,
      potentialEAuctionOpportunityInrCr: Module2CategoryProfileHelper.toCr(eauctionCalc.opportunityInr),
      potentialEAuctionOpportunityPct: eauctionCalc.opportunityPct,

      consolidationSuitability: consolCalc.suitability,
      consolidationSuitabilityRationale: consolCalc.rationale,
      potentialVendorConsolidationOpportunityInr: consolCalc.opportunityInr,
      potentialVendorConsolidationOpportunityInrCr: Module2CategoryProfileHelper.toCr(consolCalc.opportunityInr),
      potentialVendorConsolidationOpportunityPct: consolCalc.opportunityPct,
      operationalConsolidation: consolCalc.operational,
      proposedTargetSupplierRange: Module2CategoryProfileHelper.resolveTargetSupplierRange(suppliers.length),
      consolidationFeasibility: Module2CategoryProfileHelper.resolveConsolidationFeasibility(
        consolCalc.opportunityInr,
        suppliers.length
      ),

      overlappingOpportunityInr: overlapOpp,
      overlappingOpportunityInrCr: Module2CategoryProfileHelper.toCr(overlapOpp),
      netQuantifiableOpportunityInr: netCalc.netInr,
      netQuantifiableOpportunityInrCr: Module2CategoryProfileHelper.toCr(netCalc.netInr),
      netQuantifiableOpportunityPct: Module2CategoryProfileHelper.toPct(netCalc.netInr, addressableSpendInr),
      isQuantifiable: netCalc.isQuantifiable,
      quantifiableDisplayText: netCalc.displayText,

      primarySourcingLever: netCalc.primaryLever,
      primarySourcingLeverRationale: `Primary lever assigned based on empirical historical price variance: ${netCalc.primaryLever}.`,
      volumeBundlingOpportunityInr: volumeBundlingOpp,
      volumeBundlingOpportunityInrCr: Module2CategoryProfileHelper.toCr(volumeBundlingOpp),
      categorySpecialistOpportunityInr: specialistOpp,
      categorySpecialistOpportunityInrCr: Module2CategoryProfileHelper.toCr(specialistOpp),
      grossQuantifiableBenefitInr: grossOpp,
      grossQuantifiableBenefitInrCr: Module2CategoryProfileHelper.toCr(grossOpp),
      benefitNotYetQuantifiable: !netCalc.isQuantifiable,
      notQuantifiableReason: !netCalc.isQuantifiable ? 'No defensible price dispersion or tier relationship in historical transactions.' : undefined,
      fiscalYearSpend,
      items,
      multiCategoryVendors: [],

      scenarios,
      waterfall,
      waterfallV2: intel.waterfallV2,

      evidenceState: intel.evidenceState,
      evidenceStateLabel: intel.evidenceStateLabel,
      twoDimensionalAssessments: intel.twoDimensionalAssessments,
      marketDiscovery: intel.marketDiscovery,
      commercialExcellence: intel.commercialExcellence,
      procurementMaturity: intel.procurementMaturity,
      actionRecommendation: intel.actionRecommendation,
      opportunityRangeMinInr: intel.opportunityRangeMinInr,
      opportunityRangeMaxInr: intel.opportunityRangeMaxInr,
      opportunityRangeMethodology: intel.opportunityRangeMethodology,

      levers,
      scorecard,
      ...evidenceData,

      calculationId,
      calculationTimestamp: new Date().toISOString(),
      calculationVersion: MODULE_2_SOURCING_VERSION,
      evidenceTransactionIds,
      missingInformation: compResult.excludedTransactions.length > 0
        ? ['Harmonized specifications required for excluded transactions to increase addressability.']
        : [],
      risksAndConstraints: [
        'Supplier lead time validation needed',
        'Commercial delivery terms harmonization recommended'
      ],
      nextStrategicAction: scorecard.justificationNotes[0] || 'Convene sourcing category review with procurement lead.'
    };
  }
}
