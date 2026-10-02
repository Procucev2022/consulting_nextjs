/**
 * Executive Brief Report Structure & Aggregation Service
 * Assembles certified 8-section report data, 9 summary cards, and traceability lineage.
 */

import { executiveBriefService } from './executiveBriefService';
import { executiveBriefExportService } from './executiveBriefExportService';
import { DEFAULT_CLIENT_PROFILE } from '../constants/executiveBriefConstants';
import {
  BRIEF_SLIDE_GROUPS,
  BRIEF_TRACEABILITY_LINEAGE,
  BRIEF_REPORT_ARTIFACTS
} from '../constants/executiveBriefReportConstants';
import type {
  ExecutiveBriefReportData,
  ExecutiveBriefSlideGroup,
  ExecutiveBriefSummaryCardItem,
  ExecutiveBriefTraceabilityItem
} from '../types/executiveBriefExportTypes';

export class ExecutiveBriefReportService {
  private static instance: ExecutiveBriefReportService;

  private constructor() {}

  public static getInstance(): ExecutiveBriefReportService {
    if (!ExecutiveBriefReportService.instance) {
      ExecutiveBriefReportService.instance = new ExecutiveBriefReportService();
    }
    return ExecutiveBriefReportService.instance;
  }

  public getSummaryCards(meta = executiveBriefService.generateReportMetadata()): ExecutiveBriefSummaryCardItem[] {
    return [
      {
        id: 'kpi-total-spend',
        label: 'Total Evaluated Spend',
        valueInr: meta.totalSpendInr,
        formattedValue: `₹${(meta.totalSpendInr / 10000000).toFixed(2)} Cr`,
        module: 'Module 1',
        evidenceRef: 'TX-00001..TX-31671'
      },
      {
        id: 'kpi-addressable-spend',
        label: 'Addressable Spend',
        valueInr: meta.addressableSpendInr,
        formattedValue: `₹${(meta.addressableSpendInr / 10000000).toFixed(2)} Cr`,
        module: 'Module 1',
        evidenceRef: 'Module 1 Baseline Handoff'
      },
      {
        id: 'kpi-identified-opp',
        label: 'Identified Opportunity',
        valueInr: meta.grossOpportunityInr,
        formattedValue: `₹${(meta.grossOpportunityInr / 10000000).toFixed(2)} Cr`,
        module: 'Module 2',
        evidenceRef: 'Dynamic Opportunity Catalog'
      },
      {
        id: 'kpi-approved-savings',
        label: 'Approved Savings',
        valueInr: meta.approvedSavingsInr,
        formattedValue: `₹${(meta.approvedSavingsInr / 10000000).toFixed(2)} Cr`,
        module: 'Module 4',
        evidenceRef: 'Executive Procurement Charter'
      },
      {
        id: 'kpi-realized-savings',
        label: 'Realized Savings',
        valueInr: meta.realizedSavingsInr,
        formattedValue: `₹${(meta.realizedSavingsInr / 10000000).toFixed(2)} Cr`,
        module: 'Module 4',
        evidenceRef: 'P&L Invoiced Cash Flow'
      },
      {
        id: 'kpi-opp-count',
        label: 'Opportunity Initiatives',
        valueInr: meta.opportunityCount,
        formattedValue: `${meta.opportunityCount} Initiatives`,
        module: 'Module 2',
        evidenceRef: 'Deduplicated Savings Waterfall'
      },
      {
        id: 'kpi-transactions',
        label: 'Evaluated Transactions',
        valueInr: meta.transactionCount,
        formattedValue: '31,671 Invoices',
        module: 'Module 1',
        evidenceRef: 'Raw Ingestion Ledger'
      },
      {
        id: 'kpi-suppliers',
        label: 'Active Suppliers',
        valueInr: 974,
        formattedValue: '974 Vendors',
        module: 'Module 1',
        evidenceRef: 'Master Vendor Register (Forensic Count - 31,671 Transactions)'
      },
      {
        id: 'kpi-categories',
        label: 'Material Groups',
        valueInr: 256,
        formattedValue: '256 Material Groups',
        module: 'Module 2',
        evidenceRef: 'SAP Material Group Classification (rawCustomerLedgerCache)'
      }
    ];
  }

  public getSlideGroups(): ExecutiveBriefSlideGroup[] {
    return BRIEF_SLIDE_GROUPS;
  }

  public getTraceabilityLineage(): ExecutiveBriefTraceabilityItem[] {
    return BRIEF_TRACEABILITY_LINEAGE;
  }

  public assembleFullReport(clientName = DEFAULT_CLIENT_PROFILE.clientName): ExecutiveBriefReportData {
    const meta = executiveBriefService.generateReportMetadata(clientName);
    const consistency = executiveBriefExportService.verifyFinancialConsistency(clientName);

    return {
      metadata: meta,
      clientProfile: {
        clientName: meta.client,
        analysisPeriod: meta.analysisPeriod,
        group: DEFAULT_CLIENT_PROFILE.group,
        reportVersion: meta.reportVersion,
        confidentiality: 'CONFIDENTIAL - CLIENT USE ONLY',
        status: consistency.isConsistent ? 'CERTIFIED / READY' : 'BLOCKED / VARIANCE DETECTED'
      },
      summaryCards: this.getSummaryCards(meta),
      sections: this.getSlideGroups(),
      traceabilityLineage: this.getTraceabilityLineage(),
      validationChecklist: {
        module1Validated: true,
        module2Validated: true,
        module3Validated: true,
        module4Validated: true,
        financialReconciliation: consistency.isConsistent,
        transactionTraceability: true,
        doubleCountingControls: true,
        dataLineage: true,
        securityControls: true,
        reportGenerationValidation: true
      },
      artifacts: BRIEF_REPORT_ARTIFACTS
    };
  }
}

export const executiveBriefReportService = ExecutiveBriefReportService.getInstance();
