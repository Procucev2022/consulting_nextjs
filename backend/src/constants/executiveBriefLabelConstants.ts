/**
 * Executive Brief display labels for the PDF, PPTX, and audit outputs.
 */
import type { ExecutiveBriefValidationChecklist } from '../types/executiveBriefExportTypes';

export const EXECUTIVE_BRIEF_CHECKLIST_LABELS: Record<keyof ExecutiveBriefValidationChecklist, string> = {
  module1Validated: 'Module 1 spend diagnostic validated',
  module2Validated: 'Module 2 opportunity intelligence validated',
  module3Validated: 'Module 3 PCBI benchmarking validated',
  module4Validated: 'Module 4 savings execution validated',
  financialReconciliation: 'Financial reconciliation against certified figures',
  transactionTraceability: 'Transaction-level traceability',
  doubleCountingControls: 'Double-counting controls applied',
  dataLineage: 'Data lineage documented',
  securityControls: 'Security and confidentiality controls',
  reportGenerationValidation: 'Report generation validation'
};

export const EXECUTIVE_BRIEF_CHECKLIST_KEYS: readonly (keyof ExecutiveBriefValidationChecklist)[] = [
  'module1Validated',
  'module2Validated',
  'module3Validated',
  'module4Validated',
  'financialReconciliation',
  'transactionTraceability',
  'doubleCountingControls',
  'dataLineage',
  'securityControls',
  'reportGenerationValidation'
];

export const EXECUTIVE_BRIEF_LABELS = {
  documentTitle: 'Executive Procurement Value & Savings Brief',
  documentSubtitle: 'Certified board briefing built from Modules 1-4',
  headerTitle: 'EXECUTIVE PROCUREMENT VALUE & SAVINGS BRIEF',
  brandFooter: 'aiCEV by Procucev',
  pairSeparator: ' | ',
  fieldSeparator: ': ',
  confidentialityPrefix: 'Management Confidential - Prepared exclusively for',
  pageLabel: 'PAGE',
  pageOfLabel: 'OF',
  statusLabel: 'Status',
  clientLabel: 'Client',
  reportDateLabel: 'Report date',
  analysisPeriodLabel: 'Analysis period',
  reportVersionLabel: 'Report version',
  groupLabel: 'Group',
  contentsTitle: 'Contents',
  contentsSummary: 'Summary of certified value',
  contentsEvidence: 'Validation checklist and traceability lineage',
  summaryTitle: 'Summary of certified value',
  summaryTable: {
    metric: 'Metric',
    value: 'Value',
    module: 'Module',
    evidence: 'Evidence'
  },
  evidenceTitle: 'Evidence and validation',
  checklistTable: {
    control: 'Control',
    status: 'Status'
  },
  checklistTitle: 'Validation checklist',
  checklistPass: 'PASS',
  checklistFail: 'FAIL',
  traceabilityTitle: 'Traceability lineage',
  sectionFields: {
    background: 'Background',
    objective: 'Objective',
    finding: 'Finding',
    evidence: 'Evidence',
    outcome: 'Outcome',
    recommendedAction: 'Recommended action',
    nextStep: 'Next step'
  },
  detailFields: {
    finding: 'Finding',
    background: 'Background',
    objective: 'Objective',
    addressableBase: 'Addressable base',
    evidence: 'Evidence',
    analysis: 'Analysis',
    methodology: 'Methodology',
    assumption: 'Assumption',
    outcome: 'Outcome',
    expectedOutcome: 'Expected outcome',
    potentialValueDisplay: 'Potential value',
    indicativeOpportunity: 'Indicative opportunity',
    confidence: 'Confidence',
    confidenceRationale: 'Confidence rationale',
    riskConstraint: 'Risk and constraint',
    recommendedAction: 'Recommended action',
    nextStep: 'Next step',
    owner: 'Owner',
    timeline: 'Timeline',
    detailedAnalysisRef: 'Detailed analysis reference'
  },
  traceabilityFields: {
    category: 'Category',
    item: 'Item',
    supplier: 'Supplier',
    erpRecord: 'ERP record',
    calculation: 'Calculation',
    opportunity: 'Opportunity',
    savings: 'Savings'
  },
  audit: {
    title: 'EXECUTIVE BRIEF AUDIT TRAIL',
    clientLabel: 'Client',
    reportDateLabel: 'Report date',
    reportVersionLabel: 'Report version',
    sourceDataLabel: 'Source data version',
    reconciliationTitle: '1. Financial reconciliation against certified figures',
    controlsTitle: '2. Validation checklist',
    artifactsTitle: '3. Artifact inventory',
    lineageTitle: '4. Traceability lineage',
    overallLabel: 'Overall reconciliation',
    metricHeader: 'Metric',
    actualHeader: 'Brief value (INR)',
    certifiedHeader: 'Certified value (INR)',
    varianceHeader: 'Variance (INR)',
    statusHeader: 'Status',
    controlHeader: 'Control',
    artifactHeader: 'Artifact',
    fileHeader: 'File',
    endpointHeader: 'Endpoint',
    findingHeader: 'Finding',
    moduleHeader: 'Module',
    savingsHeader: 'Savings',
    metricLabels: {
      totalSpend: 'Total evaluated spend',
      addressableSpend: 'Addressable spend',
      grossOpportunity: 'Gross identified opportunity',
      netDefensibleOpportunity: 'Net defensible opportunity',
      approvedSavings: 'Approved savings',
      realizedSavings: 'Realized savings'
    }
  }
} as const;
