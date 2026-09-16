import { geminiService } from './geminiService';
import { EXECUTIVE_REPORT_SYSTEM_PROMPT, EXTRACTION_STATUS } from '../constants/ai';
import type { ExecutiveReportData, ExecutiveReportResult } from '../types/ai';
import logger from '../utils/logger';

export class AiReportService {
  public async generateExecutiveSummary(spendSummary: {
    tenantName?: string;
    totalSpendInrCr: number;
    categories: Array<{ name: string; spendInrCr: number; targetReductionPct: number }>;
    vendors: Array<{ vendorName: string; totalSpendInrCr: number; priceCreepPct?: number }>;
    currency?: string;
  }): Promise<ExecutiveReportResult> {
    const categoryLines = (spendSummary.categories || [])
      .slice(0, 15)
      .map((c) => `- ${c.name}: ₹${c.spendInrCr.toFixed(2)} Cr (Target Reduction: ${c.targetReductionPct}%)`)
      .join('\n');

    const vendorLines = (spendSummary.vendors || [])
      .slice(0, 15)
      .map((v) => `- ${v.vendorName}: ₹${v.totalSpendInrCr.toFixed(2)} Cr (Price Creep: ${v.priceCreepPct ?? 0}%)`)
      .join('\n');

    const prompt = `${EXECUTIVE_REPORT_SYSTEM_PROMPT}

ENTERPRISE CONTEXT:
- Enterprise: ${spendSummary.tenantName || 'Global Enterprise Client'}
- Total Evaluated Spend: ₹${spendSummary.totalSpendInrCr.toFixed(2)} Cr
- Currency: ${spendSummary.currency || 'INR'}

TOP SPEND CATEGORIES:
${categoryLines || '(No category data)'}

TOP SUPPLIERS & VOLATILITY:
${vendorLines || '(No vendor data)'}`;

    const result = await geminiService.generateJson<ExecutiveReportData>({
      prompt,
      label: 'CPO Strategic Executive Report'
    });

    if (result.status !== EXTRACTION_STATUS.SUCCESS || !result.data) {
      logger.warn('AI executive report generation fell back to deterministic summary', {
        status: result.status,
        error: result.error
      });

      const fallbackData: ExecutiveReportData = {
        executiveSummary: `Strategic sourcing analysis evaluated ₹${spendSummary.totalSpendInrCr.toFixed(2)} Cr in procurement expenditure across ${(spendSummary.categories || []).length} key spend categories. Consolidation and category management initiatives present significant cost optimization levers.`,
        totalSpendEvaluated: spendSummary.totalSpendInrCr,
        topRiskObservations: [
          'High concentration of annual spend among top tier 1 suppliers requires multi-sourcing hedging.',
          'Price creep and index variances observed in key raw material and engineering categories.'
        ],
        savingsOpportunities: (spendSummary.categories || []).slice(0, 5).map((c) => ({
          category: c.name,
          currentSpendInrCr: c.spendInrCr,
          targetSavingsPct: c.targetReductionPct,
          estSavingsInrCr: Number(((c.spendInrCr * c.targetReductionPct) / 100).toFixed(2)),
          actionableStrategy: 'Implement reverse auctions and consolidated frame agreements with dynamic index-linked pricing.'
        })),
        vendorConsolidationRoadmap: [
          'Bundle tail-spend requirements into master contracts with top quartile suppliers.',
          'Standardize engineering and maintenance specifications across plants.'
        ],
        strategicRoadmapPhases: [
          {
            phase: 'Phase 1: Quick Wins (0-90 Days)',
            actions: ['Execute e-auctions for standardized categories', 'Eliminate uncontracted rogue purchasing']
          },
          {
            phase: 'Phase 2: Strategic Renegotiations (90-180 Days)',
            actions: ['Consolidate vendor rosters across operating plants', 'Enforce structured payment terms']
          },
          {
            phase: 'Phase 3: Value Engineering & Partnerships (180-365 Days)',
            actions: ['Implement vendor development programs', 'Integrate digital automated procurement workflows']
          }
        ]
      };

      return {
        status: EXTRACTION_STATUS.SUCCESS,
        data: fallbackData,
        model: result.model,
        error: result.error
      };
    }

    return {
      status: EXTRACTION_STATUS.SUCCESS,
      data: result.data,
      model: result.model,
      error: null
    };
  }
}

export const aiReportService = new AiReportService();
