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
    pdfDetails: '30-slide / 16:9 presentation format',
    pdfAction: 'Download PDF',
    pptxTitle: 'POWERPOINT',
    pptxSubtitle: 'Editable Executive Presentation',
    pptxDetails: 'Native editable PowerPoint slides (16:9)',
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
      { key: 'cover', title: '01. Cover Slide', page: 1 },
      { key: 'exec_summary', title: '02. Executive Summary', page: 2 },
      { key: 'opp_summary', title: '09. Opportunity Summary', page: 9 },
      { key: 'module1', title: '11. Spend Diagnostic', page: 11 },
      { key: 'module2', title: '14. Strategic Sourcing', page: 14 },
      { key: 'module3', title: '20. PCBI Benchmarks', page: 20 },
      { key: 'module4', title: '23. Savings Execution', page: 23 },
      { key: 'recommendations', title: '26. Recommendations', page: 26 },
      { key: 'roadmap', title: '25. Phased Roadmap', page: 25 },
      { key: 'appendix', title: '30. Evidence Appendix', page: 30 }
    ]
  },
  structure: {
    sectionTitle: 'REPORT STRUCTURE (30-SLIDE BOARD DELIVERABLE)',
    backgroundLabel: 'Background',
    objectiveLabel: 'Objective',
    findingLabel: 'Finding',
    evidenceLabel: 'Evidence',
    outcomeLabel: 'Outcome',
    actionLabel: 'Recommended Action',
    nextStepLabel: 'Next Step',
    viewDetailedAnalysis: 'View Detailed Analysis ▾',
    hideDetailedAnalysis: 'Hide Detailed Analysis ▴',
    viewEvidence: 'View Evidence ▾',
    viewCalculation: 'View Calculation ▾'
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
