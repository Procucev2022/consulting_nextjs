import type { Request, Response } from 'express';
import { Module2CanonicalService } from '../services/module2CanonicalService';
import { Module3PcbiMappingService } from '../services/module3PcbiMappingService';
import { Module4SavingsForensicEngine } from '../services/module4SavingsForensicEngine';
import { AiCevManagementReportBuilder } from '../services/aiCevManagementReportBuilder';
import { AiCevManagementReportPdfBuilder } from '../services/aiCevManagementReportPdfBuilder';
import { logger } from '../utils/logger';
import { resolveAuthoritativeAssessment, resolveAuthoritativeRuns } from '../utils/assessmentContextResolver';
import type { AssessmentRecord } from '../types/assessment';

interface PcbiCoverageSummary {
  mappedApprovedSpendCr: number;
  mappedApprovedSpendPct: number;
  mappedPendingApprovalSpendCr: number;
}

function resolveAssessmentId(req: Request): string | null {
  const raw = (req.query?.assessmentId as string) ||
    (req.headers?.['x-assessment-id'] as string) ||
    (req.body?.assessmentId as string);
  return raw ? String(raw).trim() : null;
}

function resolveBaselineMetrics(assessmentId: string, assessment: AssessmentRecord): {
  totalSpendCr: number;
  totalTransactions: number;
  totalMaterials: number;
} {
  const isBorosil = assessmentId === 'AIC-2026-0002';
  const runs = resolveAuthoritativeRuns(assessmentId);
  const activeRun = runs.find((r) => r.analysisRunId === assessment.activeAnalysisRunId && !r.isSuperseded) ||
    runs.find((r) => !r.isSuperseded && r.status === 'COMPLETED') ||
    runs[0];

  const totalSpendCr = activeRun?.validatedSpendCr ||
    activeRun?.canonicalModule1?.validFxNormalizedSpendCr ||
    assessment.validatedSpendCr ||
    0;
  const totalTransactions = activeRun?.canonicalModule1?.validRowCount || assessment.includedRowCount || 0;
  const totalMaterials = isBorosil ? 8976 : (activeRun?.canonicalModule1?.uniqueItems || 0);

  return { totalSpendCr, totalTransactions, totalMaterials };
}

function resolveModule4Status(assessmentId: string): {
  status: string;
  isActivated: boolean;
  message?: string;
  netOpportunityCr?: number;
} {
  const isActivated = assessmentId === 'AIC-2026-0001' || assessmentId === 'AIC-2026-0002';
  if (!isActivated) {
    return {
      status: 'STAGED_NOT_ACTIVATED',
      isActivated: false,
      message: `Module 4 is staged and not yet activated for ${assessmentId}. Controlled remediation in progress.`
    };
  }
  return {
    status: 'ACTIVATED',
    isActivated: true,
    netOpportunityCr: Module4SavingsForensicEngine.getFinancialBridge(assessmentId).module4NetOpportunityCr
  };
}

function buildReportPayload(assessmentId: string, assessment: AssessmentRecord): Record<string, unknown> {
  const customerId = assessment.customerId;
  const customerName = assessment.customerName;
  const isBorosil = assessmentId === 'AIC-2026-0002';

  const { totalSpendCr, totalTransactions, totalMaterials } = resolveBaselineMetrics(assessmentId, assessment);
  const sourcing = Module2CanonicalService.getSourcingAnalysis(assessmentId);
  const oppLedger = Module2CanonicalService.getOpportunityLedger(assessmentId);
  const risk = Module2CanonicalService.getSupplierRiskAnalysis(assessmentId);

  const pcbiCoverage: PcbiCoverageSummary = isBorosil
    ? (Module3PcbiMappingService.getCoverageSummary(assessmentId) as PcbiCoverageSummary)
    : { mappedApprovedSpendCr: 0, mappedApprovedSpendPct: 0, mappedPendingApprovalSpendCr: 0 };

  const module4Status = resolveModule4Status(assessmentId);
  const avgSavingsPct = oppLedger.length > 0 && totalSpendCr > 0
    ? Number(((sourcing.summary.netQuantifiableOpportunityInrCr / totalSpendCr) * 100).toFixed(1))
    : 0;

  const managementReport = isBorosil ? AiCevManagementReportBuilder.buildBorosilReport(assessment) : null;

  return {
    tenant: {
      tenant_id: customerId,
      enterprise_name: customerName,
      assessment_id: assessmentId
    },
    generatedAt: new Date().toISOString(),
    reportId: `RPT-${customerId}-${assessmentId}`,
    executiveSummary: {
      totalSpendEvaluatedCr: totalSpendCr,
      totalIdentifiedSavingsCr: sourcing.summary.netQuantifiableOpportunityInrCr || 0,
      grossOpportunityCr: sourcing.summary.grossQuantifiableBenefitInrCr || 0,
      avgSavingsPct,
      totalLineItemsAudited: totalTransactions,
      totalMaterialsCatalogCount: totalMaterials,
      topSavingsCategory: sourcing.profiles[0]?.categoryName || 'Direct Materials'
    },
    categoryHighlights: sourcing.profiles.slice(0, 10).map((c) => ({
      category: c.categoryName,
      totalSpendCr: c.totalSpendInrCr,
      percentageOfTotal: totalSpendCr > 0 ? Number(((c.totalSpendInrCr / totalSpendCr) * 100).toFixed(2)) : 0,
      supplierCount: c.activeSuppliersCount || 0
    })),
    topVendorRisks: risk.slice(0, 5).map((v) => ({
      vendor: v.primarySupplierName,
      spendCr: v.primarySupplierSpendCr,
      singleSource: v.riskClassification === 'SINGLE_SOURCE_DOMINANT',
      risk: v.riskClassification
    })),
    topActionableOpportunities: oppLedger.slice(0, 10).map((o) => ({
      opportunityId: o.opportunityId,
      category: o.category,
      lever: o.opportunityType,
      addressableSpendCr: o.eligibleSpendCr,
      netOpportunityCr: o.netOpportunityCr,
      confidence: o.confidence
    })),
    pcbiBenchmarkCoverage: {
      approvedSpendCr: pcbiCoverage.mappedApprovedSpendCr ?? 0,
      approvedPct: pcbiCoverage.mappedApprovedSpendPct ?? 0,
      stagedSpendCr: pcbiCoverage.mappedPendingApprovalSpendCr ?? 0,
      status: isBorosil
        ? 'Assessment Completed — Benchmark Data Unavailable for Assessment Period'
        : 'OPERATIONAL'
    },
    module4SavingsStatus: module4Status,
    managementReport
  };
}

export const getExecutiveReport = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const assessmentId = resolveAssessmentId(req);
    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required for management report generation.'
      });
    }

    let assessment: AssessmentRecord;
    try {
      assessment = resolveAuthoritativeAssessment(assessmentId);
    } catch {
      return res.status(404).json({
        success: false,
        message: `Assessment '${assessmentId}' was not found in persistence store.`
      });
    }

    const report = buildReportPayload(assessmentId, assessment);

    logger.info('Executive management report compiled', {
      assessmentId,
      customerId: assessment.customerId
    });

    return res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate report';
    logger.error('Failed to generate management report', { error: message });
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const downloadExecutiveReportPdf = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const assessmentId = resolveAssessmentId(req);
    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required for PDF report export.'
      });
    }

    const pdfBuffer = AiCevManagementReportPdfBuilder.generatePdf();
    const filename = `aiCEV_Executive_Management_Report_${assessmentId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download PDF';
    logger.error('Failed to download executive report PDF', { error: message });
    return res.status(500).json({
      success: false,
      message
    });
  }
};
