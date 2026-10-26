/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Helper Functions
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  AuctionSuitabilityClassification,
  EAuctionMaterialCandidate,
  EAuctionCategoryCandidate,
  EAuctionSavingsRange,
  AuctionPlanningAssumption
} from '../types/module2EAuction';
import {
  EAUCTION_CONFIG,
  AUCTION_SUITABILITY_LABELS,
  DEFAULT_AUCTION_PLANNING_ASSUMPTIONS
} from '../constants/module2EAuction';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';

export interface MaterialEvaluationInput {
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  financialYear: string;
  uom: string;
  txs: StrategicInputTransaction[];
  configuredAssumptions?: AuctionPlanningAssumption[];
}

export function evaluateMaterialSuitability(
  supplierCount: number,
  poCount: number,
  totalSpendInr: number,
  priceDispersionPct: number,
  materialCode: string
): { suitability: AuctionSuitabilityClassification; rationale: string; limitations: string } {
  if (!materialCode || materialCode === 'UNKNOWN_MAT') {
    return {
      suitability: AUCTION_SUITABILITY_LABELS.NOT_ASSESSED,
      rationale: 'Incomplete line item attributes or unclassified item; unable to evaluate auction feasibility.',
      limitations: 'Missing verified SAP material master code.'
    };
  }

  if (
    supplierCount >= 2 &&
    poCount >= EAUCTION_CONFIG.MIN_REPEAT_POS_MULTI_SUPPLIER &&
    totalSpendInr >= EAUCTION_CONFIG.MIN_SPEND_INR_MULTI_SUPPLIER &&
    priceDispersionPct > 0
  ) {
    return {
      suitability: AUCTION_SUITABILITY_LABELS.CANDIDATE,
      rationale: `Multi-supplier history (${supplierCount} suppliers, ${poCount} POs) with observed price dispersion (${priceDispersionPct.toFixed(1)}%); high commercial viability for dynamic bidding.`,
      limitations: 'Supplier digital auction readiness and live bid participation unverified in historical data.'
    };
  }

  if (
    supplierCount === 1 &&
    poCount >= EAUCTION_CONFIG.MIN_REPEAT_POS_SINGLE_SUPPLIER &&
    totalSpendInr >= EAUCTION_CONFIG.MIN_SPEND_INR_SINGLE_SUPPLIER
  ) {
    const spendCr = (totalSpendInr / 10000000).toFixed(2);
    return {
      suitability: AUCTION_SUITABILITY_LABELS.CANDIDATE,
      rationale: `High-spend repeat single-source purchases (${poCount} POs, ₹${spendCr} Cr); candidate for market competition and supplier discovery review.`,
      limitations: 'Sole historical supplier; market competition feasibility requires market sounding.'
    };
  }

  if (poCount >= 2 && totalSpendInr >= 200000) {
    return {
      suitability: AUCTION_SUITABILITY_LABELS.FURTHER_DATA,
      rationale: `Moderate transaction history (${poCount} POs) but limited supplier evidence; requires technical specification and supply market discovery.`,
      limitations: 'Insufficient multi-supplier evidence to confirm competitive dynamic bidding.'
    };
  }

  return {
    suitability: AUCTION_SUITABILITY_LABELS.NOT_SUITABLE,
    rationale: `Isolated or low-spend purchase (${poCount} PO, ₹${(totalSpendInr / 100000).toFixed(2)}L); dynamic auction administration cost exceeds expected benefits.`,
    limitations: 'Low annual spend and lack of recurring volume make dynamic bidding uneconomical.'
  };
}

export function resolveAssumptionAndCalculateSavingsRange(
  categoryName: string,
  materialCode: string,
  suitability: AuctionSuitabilityClassification,
  addressableSpendInr: number,
  customAssumptions?: AuctionPlanningAssumption[]
): EAuctionSavingsRange {
  const addressableSpendCr = Number((addressableSpendInr / 10000000).toFixed(4));

  if (suitability !== AUCTION_SUITABILITY_LABELS.CANDIDATE) {
    return {
      savingsRangeStatus: 'NOT_YET_QUANTIFIABLE',
      addressableSpendInr,
      addressableSpendCr,
      notes: 'Not Yet Quantifiable — Category / material is not currently classified as candidate for dynamic bidding.'
    };
  }

  const assumptionsList =
    customAssumptions && customAssumptions.length > 0 ? customAssumptions : DEFAULT_AUCTION_PLANNING_ASSUMPTIONS;

  const catLower = categoryName.toLowerCase();
  const matLower = materialCode.toLowerCase();

  let matched = assumptionsList.find(
    (a) => a.categoryOrMaterial.toLowerCase() === matLower || catLower.includes(a.categoryOrMaterial.toLowerCase())
  );
  if (!matched) {
    matched = assumptionsList.find((a) => a.categoryOrMaterial === 'DEFAULT');
  }

  const isApprovedOrProposed =
    matched &&
    (matched.approvalStatus === 'APPROVED' ||
      matched.approvalStatus === 'Proposed Planning Assumption — Approval Required');

  if (!matched || !isApprovedOrProposed) {
    return {
      savingsRangeStatus: 'NOT_YET_QUANTIFIABLE',
      addressableSpendInr,
      addressableSpendCr,
      approvalStatus: matched?.approvalStatus || 'UNQUANTIFIABLE',
      notes: 'Not Yet Quantifiable — Pending procurement approval of defensible auction benchmark.'
    };
  }

  const minRate = Math.min(matched.minSavingsRate, matched.expectedSavingsRate, matched.maxSavingsRate);
  const maxRate = Math.max(matched.minSavingsRate, matched.expectedSavingsRate, matched.maxSavingsRate);
  const expRate = Math.min(Math.max(matched.expectedSavingsRate, minRate), maxRate);

  const minInr = Math.round(addressableSpendInr * minRate * 100) / 100;
  const expInr = Math.round(addressableSpendInr * expRate * 100) / 100;
  const maxInr = Math.round(addressableSpendInr * maxRate * 100) / 100;

  return {
    savingsRangeStatus: 'ESTIMATED',
    addressableSpendInr,
    addressableSpendCr,
    minSavingsRate: minRate,
    expectedSavingsRate: expRate,
    maxSavingsRate: maxRate,
    minEstimatedSavingsInr: minInr,
    minEstimatedSavingsCr: Number((minInr / 10000000).toFixed(4)),
    expectedEstimatedSavingsInr: expInr,
    expectedEstimatedSavingsCr: Number((expInr / 10000000).toFixed(4)),
    maxEstimatedSavingsInr: maxInr,
    maxEstimatedSavingsCr: Number((maxInr / 10000000).toFixed(4)),
    rateSource: matched.rateSource,
    referencePeriod: matched.referencePeriod,
    applicability: matched.applicability,
    approvalStatus: matched.approvalStatus,
    approvedBy: matched.approvedBy,
    approvedDate: matched.approvedDate,
    confidence: matched.confidence,
    isPlanningAssumptionOnly: matched.isPlanningAssumptionOnly,
    notes:
      matched.notes ||
      (matched.approvalStatus === 'Proposed Planning Assumption — Approval Required'
        ? 'Proposed Planning Assumption — Approval Required. Provisional range editable by authorised user.'
        : 'Indicative dynamic bidding savings range based on planning assumptions. Not guaranteed.')
  };
}

export function buildMaterialCandidate(input: MaterialEvaluationInput): EAuctionMaterialCandidate {
  const prices = input.txs.map((t) => t.unit_price || 0).filter((p) => p > 0);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const totalSpend = Math.round(input.txs.reduce((sum, t) => sum + (t.total_spend_inr || 0), 0) * 100) / 100;
  const totalQty = Math.round(input.txs.reduce((sum, t) => sum + (t.quantity || 0), 0) * 1000) / 1000;
  const pos = new Set(input.txs.map((t) => t.po_number || t.id)).size;
  const suppliers = new Set(input.txs.map((t) => (t.vendor_name || t.vendor_code || '').trim()).filter(Boolean)).size;
  const plants = new Set(input.txs.map((t) => (t.plant || '').trim()).filter(Boolean)).size;

  const dispersionPct = lowestPrice > 0 ? ((highestPrice - lowestPrice) / lowestPrice) * 100 : 0;
  const weightedPrice = totalQty > 0 ? totalSpend / totalQty : lowestPrice;
  const priceRange = lowestPrice === highestPrice ? `₹${lowestPrice}` : `₹${lowestPrice} – ₹${highestPrice}`;

  const { suitability, rationale, limitations } = evaluateMaterialSuitability(
    suppliers,
    pos,
    totalSpend,
    dispersionPct,
    input.materialCode
  );

  const addressableSpendInr = suitability === AUCTION_SUITABILITY_LABELS.CANDIDATE ? totalSpend : 0;
  const addressableSpendCr = Number((addressableSpendInr / 10000000).toFixed(4));

  const savingsRange = resolveAssumptionAndCalculateSavingsRange(
    input.spendCategory,
    input.materialCode,
    suitability,
    addressableSpendInr,
    input.configuredAssumptions
  );

  const humanCategory = resolveHumanReadableCategory(input.spendCategory, input.materialCode);

  return {
    materialCode: input.materialCode,
    materialDesc: input.materialDesc,
    spendCategory: humanCategory,
    unspscCode: EAUCTION_CONFIG.UNMAPPED_UNSPSC_CODE,
    unspscCategory: humanCategory,
    financialYear: input.financialYear,
    totalSpendInr: totalSpend,
    totalSpendCr: Number((totalSpend / 10000000).toFixed(4)),
    addressableSpendInr,
    addressableSpendCr,
    totalQuantity: totalQty,
    uom: input.uom,
    poCount: pos,
    supplierCount: suppliers,
    plantCount: plants,
    lowestUnitPrice: Math.round(lowestPrice * 100) / 100,
    highestUnitPrice: Math.round(highestPrice * 100) / 100,
    priceRangeStr: priceRange,
    weightedAveragePrice: Math.round(weightedPrice * 100) / 100,
    priceDispersionPct: Math.round(dispersionPct * 10) / 10,
    suitability,
    evidenceRationale: rationale,
    missingInfoLimitations: limitations,
    procurementReviewRequirements: [...EAUCTION_CONFIG.PROCUREMENT_REVIEW_REQUIREMENTS],
    savingsRange,
    transactions: input.txs
  };
}

export function rollUpCategoryCandidate(
  spendCategory: string,
  materials: EAuctionMaterialCandidate[]
): EAuctionCategoryCandidate {
  const totalSpend = Math.round(materials.reduce((sum, m) => sum + m.totalSpendInr, 0) * 100) / 100;
  const totalQty = Math.round(materials.reduce((sum, m) => sum + m.totalQuantity, 0) * 1000) / 1000;
  const uoms = new Set(materials.map((m) => m.uom));
  const uom = uoms.size === 1 ? materials[0].uom : 'MIXED';
  const pos = materials.reduce((sum, m) => sum + m.poCount, 0);
  const suppliers = Math.max(...materials.map((m) => m.supplierCount), 0);
  const plants = Math.max(...materials.map((m) => m.plantCount), 0);

  const candidateMats = materials.filter((m) => m.suitability === AUCTION_SUITABILITY_LABELS.CANDIDATE);
  const furtherDataMats = materials.filter((m) => m.suitability === AUCTION_SUITABILITY_LABELS.FURTHER_DATA);

  let categorySuitability: AuctionSuitabilityClassification = AUCTION_SUITABILITY_LABELS.NOT_SUITABLE;
  let evidenceRationale = 'Low transaction recurrence and fragmented ad-hoc purchases; not suitable for dynamic bidding.';
  let dataLimitations = 'Fragmented spend with minimal multi-supplier bidding history.';

  if (candidateMats.length > 0) {
    categorySuitability = AUCTION_SUITABILITY_LABELS.CANDIDATE;
    evidenceRationale = `${candidateMats.length} candidate material(s) identified with competitive supplier history and observed price variation.`;
    dataLimitations = 'Requires technical specification standardization and supplier bidding willingness verification.';
  } else if (furtherDataMats.length > 0) {
    categorySuitability = AUCTION_SUITABILITY_LABELS.FURTHER_DATA;
    evidenceRationale = 'Category contains repeat purchases but supplier participation and specification details require validation.';
    dataLimitations = 'Limited supplier count or missing detailed technical specs across purchase orders.';
  }

  const hasDispersion = materials.some((m) => m.priceDispersionPct > 0);
  const priceVariationIndicator = hasDispersion
    ? `Observed price dispersion across ${materials.filter((m) => m.priceDispersionPct > 0).length} material(s)`
    : 'Uniform pricing / Single transaction';

  const categoryAddressableSpendInr = candidateMats.reduce((sum, m) => sum + m.addressableSpendInr, 0);
  const categoryAddressableSpendCr = Number((categoryAddressableSpendInr / 10000000).toFixed(4));

  let categorySavingsRange: EAuctionSavingsRange;
  if (candidateMats.length > 0) {
    const minSavingsInr = candidateMats.reduce((sum, m) => sum + (m.savingsRange.minEstimatedSavingsInr || 0), 0);
    const expSavingsInr = candidateMats.reduce((sum, m) => sum + (m.savingsRange.expectedEstimatedSavingsInr || 0), 0);
    const maxSavingsInr = candidateMats.reduce((sum, m) => sum + (m.savingsRange.maxEstimatedSavingsInr || 0), 0);

    const firstRange = candidateMats[0].savingsRange;
    categorySavingsRange = {
      savingsRangeStatus: 'ESTIMATED',
      addressableSpendInr: categoryAddressableSpendInr,
      addressableSpendCr: categoryAddressableSpendCr,
      minEstimatedSavingsInr: minSavingsInr,
      minEstimatedSavingsCr: Number((minSavingsInr / 10000000).toFixed(4)),
      expectedEstimatedSavingsInr: expSavingsInr,
      expectedEstimatedSavingsCr: Number((expSavingsInr / 10000000).toFixed(4)),
      maxEstimatedSavingsInr: maxSavingsInr,
      maxEstimatedSavingsCr: Number((maxSavingsInr / 10000000).toFixed(4)),
      minSavingsRate:
        categoryAddressableSpendInr > 0 ? minSavingsInr / categoryAddressableSpendInr : firstRange.minSavingsRate,
      expectedSavingsRate:
        categoryAddressableSpendInr > 0 ? expSavingsInr / categoryAddressableSpendInr : firstRange.expectedSavingsRate,
      maxSavingsRate:
        categoryAddressableSpendInr > 0 ? maxSavingsInr / categoryAddressableSpendInr : firstRange.maxSavingsRate,
      rateSource: firstRange.rateSource,
      referencePeriod: firstRange.referencePeriod,
      applicability: firstRange.applicability,
      approvalStatus: firstRange.approvalStatus,
      confidence: firstRange.confidence,
      isPlanningAssumptionOnly: true,
      notes: 'Aggregated category savings range from constituent candidate materials.'
    };
  } else {
    categorySavingsRange = {
      savingsRangeStatus: 'NOT_YET_QUANTIFIABLE',
      addressableSpendInr: categoryAddressableSpendInr,
      addressableSpendCr: categoryAddressableSpendCr,
      notes: 'Not Yet Quantifiable — No materials within this category currently qualify as dynamic bidding candidates.'
    };
  }

  const humanCategory = resolveHumanReadableCategory(spendCategory, materials[0]?.materialCode);

  return {
    unspscCode: EAUCTION_CONFIG.UNMAPPED_UNSPSC_CODE,
    unspscCategory: humanCategory,
    spendCategory: humanCategory,
    totalSpendInr: totalSpend,
    totalSpendCr: Number((totalSpend / 10000000).toFixed(4)),
    addressableSpendInr: categoryAddressableSpendInr,
    addressableSpendCr: categoryAddressableSpendCr,
    purchaseQuantity: totalQty,
    uom,
    distinctMaterialCount: new Set(materials.map((m) => m.materialCode)).size,
    poCount: pos,
    supplierCount: suppliers,
    plantCount: plants,
    priceVariationIndicator,
    auctionSuitability: categorySuitability,
    evidenceBasedRationale: evidenceRationale,
    dataLimitations,
    savingsRange: categorySavingsRange,
    materials: [...materials].sort((a, b) => b.totalSpendInr - a.totalSpendInr)
  };
}
