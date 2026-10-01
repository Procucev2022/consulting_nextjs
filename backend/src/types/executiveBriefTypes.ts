/**
 * Executive Procurement Value & Savings Brief Types & Interfaces (Prompt 257)
 */

export interface ExecutiveBriefMetadata {
  client: string;
  reportDate: string;
  analysisPeriod: string;
  modulesIncluded: string[];
  transactionCount: number;
  totalSpendInr: number;
  addressableSpendInr: number;
  grossOpportunityInr: number;
  netDefensibleOpportunityInr: number;
  approvedSavingsInr: number;
  realizedSavingsInr: number;
  opportunityCount: number;
  confidenceSummary: {
    high: number;
    medium: number;
    low: number;
    insufficient: number;
  };
  sourceReferences: Array<{
    topic: string;
    source: string;
    sourceDate?: string;
    url?: string;
  }>;
  reportVersion: string;
}

export interface ExecutiveFindingCard {
  findingId: string;
  title: string;
  finding?: string;
  background: string;
  objective: string;
  addressableBase?: string;
  evidence: string;
  analysis: string;
  methodology?: string;
  assumption?: string;
  outcome: string;
  expectedOutcome?: string;
  potentialValueInr: number;
  potentialValueDisplay: string;
  indicativeOpportunity?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  confidenceRationale: string;
  riskConstraint: string;
  recommendedAction?: string;
  nextStep: string;
  owner: 'Customer' | 'Procucev' | 'Joint';
  timeline: string;
  detailedAnalysisRef: string;
}

export interface OpportunityLeverSummary {
  leverId: string;
  leverName: string;
  eligibleSpendInr: number;
  opportunityInr: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'In Wave 1' | 'Pipeline' | 'Realized';
}

export interface PriceDispersionItem {
  category: string;
  item: string;
  uom: string;
  min: number;
  p10: number;
  p25: number;
  median: number;
  weightedAvg: number;
  p75: number;
  p90: number;
  max: number;
  eligibleSpendInr: number;
  potentialOppInr: number;
  confidence: string;
  supportingTxCount: number;
}

export interface EAuctionOpportunity {
  category: string;
  eligibleSpendInr: number;
  supplierCount: number;
  historicalDispersion: string;
  auctionSuitability: string;
  recommendedAuctionType: string;
  reserveLogic: string;
  potentialBenefitInr: number;
  confidence: string;
  nextAction: string;
}

export interface VendorConsolidationPlan {
  category: string;
  currentState: string;
  targetState: string;
  eligibleSpendInr: number;
  supplierRationalization: string;
  potentialBenefitInr: number;
  risk: string;
  nextStep: string;
}

export interface PCBIBenchmarkItem {
  commodity: string;
  specification: string;
  customerPrice: number;
  pcbiReference: number;
  variancePercent: number;
  period: string;
  uom: string;
  currency: string;
  source: string;
  qualityRating: string;
}

export interface SavingsInitiative {
  initiativeId: string;
  initiative: string;
  category: string;
  baselineSpendInr: number;
  targetInr: number;
  approvedBenefitInr: number;
  realizedBenefitInr: number;
  realizationPercent: number;
  status: string;
  owner: string;
  timeline: string;
}

export interface ExecutiveBriefValidationResult {
  totalPages: number;
  totalCharts: number;
  totalFindings: number;
  totalOpportunities: number;
  totalEvidenceReferences: number;
  totalExternalSources: number;
  financialVariance: number;
  financialReconciliationStatus: 'PASS' | 'FAIL';
  module1Linkage: 'VERIFIED';
  module2Linkage: 'VERIFIED';
  module3Linkage: 'VERIFIED';
  module4Linkage: 'VERIFIED';
  securityStatus: 'VERIFIED';
  pdfRenderingStatus: 'VERIFIED';
  finalStatus: 'EXECUTIVE_BRIEF_READY' | 'EXECUTIVE_BRIEF_BLOCKED';
}
