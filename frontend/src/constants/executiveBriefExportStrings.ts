export const EXECUTIVE_BRIEF_EXPORT_STRINGS = {
  panelTitle: 'EXECUTIVE PROCUREMENT VALUE & SAVINGS BRIEF',
  certifiedBadge: 'Certified Report',
  readyBadge: 'CERTIFIED / READY',
  confidentialHeader: 'CONFIDENTIAL — CLIENT USE ONLY',
  dataProtectionStatement:
    'Client procurement data is processed within the secured tenant environment and is not used for AI model training or reused across customers.',
  pipeline: {
    module1Title: 'MODULE 1',
    module1Sub: 'Spend Diagnostic',
    module2Title: 'MODULE 2',
    module2Sub: 'Strategic Sourcing',
    module3Title: 'MODULE 3',
    module3Sub: 'PCBI Benchmarking',
    module4Title: 'MODULE 4',
    module4Sub: 'Savings Execution',
    briefTitle: 'EXECUTIVE BRIEF',
    briefSub: 'CEO / CFO Report'
  },
  summaryCards: {
    title: 'CERTIFIED PROCUREMENT METRICS',
    viewEvidence: 'View Evidence ▾',
    viewCalculation: 'View Calculation ▾'
  },
  formats: {
    sectionTitle: 'REPORT FORMATS',
    pdfTitle: 'PDF',
    pdfSubtitle: 'Executive Board Report',
    pdfDetails: '15-slide / 16:9 presentation format',
    pdfAction: 'Download PDF',
    pptxTitle: 'POWERPOINT',
    pptxSubtitle: 'Editable Executive Presentation',
    pptxDetails: 'Native editable PowerPoint slides (15 slides, 16:9)',
    pptxAction: 'Download PPTX',
    pptxAvailable: 'PPTX generation available',
    pptxGenerateAction: 'Generate PPTX',
    regenerateTitle: 'Administrative Action',
    regenerateAction: 'Regenerate Executive Brief',
    regenerating: 'Regenerating Brief...'
  },
  preview: {
    sectionTitle: 'EXECUTIVE BRIEF PREVIEW',
    openFullReport: 'Open Full Report',
    downloadPdf: 'Download PDF',
    slides: [
      { key: 'procucev_overview', title: '01. Title & Methodology Overview', page: 1 },
      { key: 'client_overview', title: '02. Company Context & Assessment Scope', page: 2 },
      { key: 'exec_summary', title: '03. Executive Summary & Opportunity Dashboard', page: 3 },
      { key: 'baseline', title: '04. Customer Spend Baseline — Module 1', page: 4 },
      { key: 'diagnostics', title: '05. Spend & Category Diagnostics', page: 5 },
      { key: 'strat_opportunities', title: '06. Lever 1 — Combined Strategic Sourcing', page: 6 },
      { key: 'vendor_consol', title: '07. Lever 2 — Vendor Base Consolidation (Validation Pending)', page: 7 },
      { key: 'eauction_bidding', title: '08. Lever 3 — E-Auction Dynamic Bidding', page: 8 },
      { key: 'po_governance', title: '09. Other Sourcing Levers & Governance', page: 9 },
      { key: 'benchmark_disclosure', title: '10. Module 3 — Benchmark Disclosure (Research Closed)', page: 10 },
      { key: 'waterfall', title: '11. Consolidated Savings Waterfall & Overlap Deduplication', page: 11 },
      { key: 'governance', title: '12. Module 4 — Savings Realization Governance', page: 12 },
      { key: 'proposed_target', title: '13. Proposed Year 1 Sourcing Target & Roadmap', page: 13 },
      { key: 'recommendations', title: '14. Management Recommendations & Action Plan', page: 14 },
      { key: 'audit_provenance', title: '15. Audit Provenance, Data Lineage & Encryption', page: 15 }
    ]
  },
  structure: {
    sectionTitle: 'REPORT STRUCTURE (15-SLIDE BOARD DELIVERABLE)',
    backgroundLabel: 'Background',
    objectiveLabel: 'Objective',
    findingLabel: 'Finding',
    evidenceLabel: 'Evidence',
    outcomeLabel: 'Outcome',
    actionLabel: 'Recommended Action',
    nextStepLabel: 'Next Step',
    addressableBaseLabel: 'Addressable Base',
    methodologyLabel: 'Methodology',
    assumptionLabel: 'Assumption',
    indicativeOpportunityLabel: 'Indicative Opportunity',
    confidenceLabel: 'Confidence',
    expectedOutcomeLabel: 'Expected Outcome',
    viewDetailedAnalysis: 'View Detailed Analysis ▾',
    hideDetailedAnalysis: 'Hide Detailed Analysis ▴',
    viewMethodology: 'View methodology ▾',
    hideMethodology: 'Hide methodology ▴',
    viewAssumptions: 'View assumptions ▾',
    hideAssumptions: 'Hide assumptions ▴',
    viewActionPlan: 'View action plan ▾',
    hideActionPlan: 'Hide action plan ▴',
    viewEvidence: 'View Evidence ▾',
    viewCalculation: 'View Calculation ▾',
    cfoDisclaimer: 'Based on analysed addressable spend and stated modelling assumptions.'
  },
  opportunityTable: {
    sectionTitle: 'ANALYSIS-WISE VALUE CREATION SUMMARY',
    subtitle: 'Transparent procurement attribution across Modules 1–4 with stated modelling assumptions',
    colAnalysis: 'Analysis / Analytical Lever',
    colAddressableSpend: 'Addressable Spend',
    colAssumptionMethod: 'Assumption / Method',
    colIndicativeOpportunity: 'Indicative Opportunity',
    colBenefitType: 'Benefit Type',
    colConfidence: 'Confidence',
    colPrimaryAction: 'Primary Action',
    cfoNote:
      'Indicative opportunity values are derived from analysed addressable spend and configurable modelling assumptions. They are not guaranteed savings and require validation through sourcing, negotiation, market testing and implementation.'
  },
  doubleCountingControl: {
    sectionTitle: 'HOW WE PREVENT DOUBLE COUNTING',
    subtitle: 'Mathematical mutual exclusivity matrix and overlap group reconciliation',
    grossTitle: 'Gross Identified Opportunity',
    grossDesc: 'Sum of all analytical levers prior to overlap deduplication',
    overlapTitle: 'Overlap Adjustment',
    overlapDesc: 'Deduction of secondary/execution levers sharing the same spend base',
    exclusionTitle: 'Exclusions & Quarantined',
    exclusionDesc: 'Non-addressable contracts, statutory tariffs, and raw material exclusions',
    netTitle: 'Net Defensible Procurement Opportunity',
    netDesc: 'Approved Board-defensible total (Hard Savings + Cost Avoidance)',
    hardSavingsTitle: 'Hard Procurement Savings',
    costAvoidanceTitle: 'Cost Avoidance Opportunity',
    productivityTitle: 'Productivity Benefit',
    productivityDesc: '20% process-effort reduction (824 POs saved annually)',
    strategicRiskTitle: 'Strategic Risk Mitigation',
    strategicRiskDesc: '4 dual-source qualified programs de-risking single-supplier bottlenecks'
  },
  traceability: {
    modalTitle: 'Financial Audit Traceability & Transaction Lineage',
    findingId: 'Finding ID',
    module: 'Module',
    category: 'Category',
    item: 'Item',
    supplier: 'Supplier',
    erpRecord: 'Transaction / ERP Record',
    calculation: 'Calculation',
    opportunity: 'Opportunity',
    savings: 'Savings',
    close: 'Close Lineage View'
  },
  validation: {
    sectionTitle: 'REPORT VALIDATION',
    items: {
      module1Validated: 'Module 1 validated',
      module2Validated: 'Module 2 validated',
      module3Validated: 'Module 3 validated',
      module4Validated: 'Module 4 validated',
      financialReconciliation: 'Financial reconciliation',
      transactionTraceability: 'Transaction traceability',
      doubleCountingControls: 'Double-counting controls',
      dataLineage: 'Data lineage',
      securityControls: 'Security controls',
      reportGenerationValidation: 'Report generation validation'
    }
  },
  artifacts: {
    sectionTitle: 'AUDIT & SUPPORTING ARTIFACTS',
    download: 'Download Artifact'
  },
  regenerationModal: {
    title: 'Confirm Report Regeneration',
    question: 'Generate the Executive Brief from the current certified Module 1–4 outputs?',
    explanation:
      'This will use the current certified data to regenerate PDF, PPTX, metadata, and audit information.',
    confirmButton: 'Confirm & Regenerate',
    cancelButton: 'Cancel'
  },
  emptyState: {
    notReadyTitle: 'Executive Brief will become available after Savings Engine completion.',
    notReadyDesc:
      'Module 4 (Savings Execution) must complete all deduplication and governance gates before certification.',
    returnToPipeline: 'Return to Procurement Pipeline'
  },
  checklists: {
    dataValidated: 'Data validated ✓',
    financialReconciliation: 'Financial reconciliation ✓',
    module1: 'Module 1 ✓',
    module2: 'Module 2 ✓',
    module3: 'Module 3 ✓',
    module4: 'Module 4 ✓'
  },
  buttons: {
    downloadPdf: 'DOWNLOAD PDF',
    downloadPdfSub: 'Official Executive Report',
    downloadPptx: 'DOWNLOAD PPTX',
    downloadPptxSub: 'Editable Presentation',
    generating: 'Generating...',
    reportDetails: 'Report Details',
    reportHistory: 'Report History'
  },
  states: {
    idle: 'Certified Brief Ready',
    preparing: 'Preparing Executive Brief...',
    generatingPdf: 'Generating PDF...',
    generatingPptx: 'Generating PowerPoint...',
    validating: 'Validating...',
    ready: 'Ready for Download',
    blocked: 'Export Blocked'
  },
  details: {
    title: 'Report Details (Auditability)',
    sourceDataVersion: 'Source Data Version',
    moduleVersions: 'Module Versions',
    analysisPeriod: 'Analysis Period',
    generationTimestamp: 'Generation Timestamp',
    validationStatus: 'Validation Status',
    financialReconciliation: 'Financial Reconciliation',
    evidenceCount: 'Evidence Count',
    opportunityCount: 'Opportunity Count',
    savingsCount: 'Savings Count',
    varianceZero: '₹0.00 Variance Verified'
  },
  history: {
    title: 'Report History',
    versionCol: 'Report Version',
    dateCol: 'Generated Date',
    byCol: 'Generated By',
    dataVerCol: 'Data Version',
    pdfCol: 'PDF',
    pptxCol: 'PPTX',
    downloadAction: 'Download',
    emptyMessage: 'No previous report generations recorded.'
  },
  metadata: {
    lastGenerated: (dateStr: string) => `Last generated: ${dateStr}`,
    reportVersion: (ver: string) => `Report Version: ${ver}`
  },
  errors: {
    fetchStatusFailed: 'Failed to retrieve executive brief certification status.',
    fetchReportFailed: 'Failed to retrieve executive brief report data.',
    downloadFailed: (format: string, reason: string) => `Failed to export ${format.toUpperCase()}: ${reason}`
  }
} as const;
