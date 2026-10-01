import type { ExecutiveBriefReportData } from '@/types';

export const mockReportData: ExecutiveBriefReportData = {
  metadata: {
    client: 'UltraTech Cement Limited',
    reportDate: '2026-10-01',
    analysisPeriod: 'FY 2021-22 to FY 2024-25',
    modulesIncluded: ['Module 1', 'Module 2', 'Module 3', 'Module 4'],
    transactionCount: 31671,
    totalSpendInr: 57420000000,
    addressableSpendInr: 49310000000,
    grossOpportunityInr: 4120000000,
    netDefensibleOpportunityInr: 2870000000,
    approvedSavingsInr: 1430000000,
    realizedSavingsInr: 680000000,
    opportunityCount: 10,
    reportVersion: 'EXECUTIVE_BRIEF_V1.1'
  },
  clientProfile: {
    clientName: 'UltraTech Cement Limited',
    analysisPeriod: 'FY 2021-22 to FY 2024-25',
    group: 'Aditya Birla Group',
    reportVersion: 'EXECUTIVE_BRIEF_V1.1',
    confidentiality: 'CONFIDENTIAL — CLIENT USE ONLY',
    status: 'CERTIFIED / READY'
  },
  summaryCards: [
    {
      id: 'kpi-total-spend',
      label: 'Total Evaluated Spend',
      valueInr: 57420000000,
      formattedValue: '₹5,742.00 Cr',
      module: 'Module 1',
      evidenceRef: 'TX-00001..TX-31671'
    }
  ],
  sections: [
    {
      groupId: '01',
      groupNumber: '01',
      title: 'Executive Overview',
      slideRange: 'Slides 01–02',
      summary: 'Strategic summary',
      background: 'Multi-year procurement history',
      objective: 'Establish definitive C-suite alignment',
      finding: 'Total addressable spend of ₹4,931 Cr yields ₹412 Cr gross potential',
      evidence: '31,671 verified transaction records',
      outcome: 'Defensible 4-wave implementation roadmap',
      recommendedAction: 'Form Joint Executive Steering Committee',
      nextStep: 'Mobilize dedicated Procucev Category Specialists',
      detailCards: [
        {
          findingId: 'FIND-01',
          title: 'Inter-Plant Unit Price Dispersion',
          background: 'Decentralized orders',
          objective: 'Rate variance',
          evidence: '340 items',
          analysis: 'Econometric variance',
          outcome: 'Rate harmonization',
          potentialValueInr: 246000000,
          potentialValueDisplay: '₹24.60 Cr',
          confidence: 'HIGH',
          confidenceRationale: '1,840 transactions',
          riskConstraint: 'Freight unbundling',
          nextStep: 'Issue contract amendments',
          owner: 'Joint',
          timeline: '30–60 Days',
          detailedAnalysisRef: 'Appendix A-01'
        }
      ]
    }
  ],
  traceabilityLineage: [
    {
      findingId: 'FIND-01',
      module: 'Module 1',
      category: 'Grinding Media',
      item: 'High Chrome Alloy Grinding Balls 60mm',
      supplier: 'AIA Engineering Ltd',
      erpRecord: 'PO-2024-88419',
      calculation: 'Rate Dispersion: ₹142.50/kg vs Median ₹128.20/kg',
      opportunity: 'Inter-plant rate harmonization',
      savings: '₹24.60 Cr Approved'
    }
  ],
  validationChecklist: {
    module1Validated: true,
    module2Validated: true,
    module3Validated: true,
    module4Validated: true,
    financialReconciliation: true,
    transactionTraceability: true,
    doubleCountingControls: true,
    dataLineage: true,
    securityControls: true,
    reportGenerationValidation: true
  },
  artifacts: [
    {
      name: 'Executive Brief Audit',
      filename: 'EXECUTIVE_BRIEF_AUDIT.md',
      description: 'Audit trail of spend baseline',
      endpoint: '/api/reports/executive-brief/audit'
    },
    {
      name: 'Official Executive Report (PDF)',
      filename: 'EXECUTIVE_BRIEF.pdf',
      description: '30-slide PDF deliverable',
      endpoint: '/api/reports/executive-brief/download/pdf'
    }
  ]
};
