import type { Request, Response } from 'express';
import { db } from '../services/db';

export const getExecutiveReport = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const tenant = db.getTenant();
    const categories = db.getCategories();
    const categoryDetails = db.getCategoryDetails();
    const vendorRankings = db.getVendorRankings();
    const opportunities = db.getOpportunities();
    const validationRecords = db.getValidationRecords();

    const totalIdentifiedSavingsCr = opportunities.reduce((s, o) => s + (o.est_savings_inr_cr || 0), 0);
    const avgSavingsRatePct = opportunities.length > 0
      ? (opportunities.reduce((s, o) => s + (o.target_savings_pct || 0), 0) / opportunities.length).toFixed(1)
      : '0';

    const report = {
      tenant,
      generatedAt: new Date().toISOString(),
      reportId: `RPT-PRC-${Date.now()}`,
      executiveSummary: {
        totalSpendEvaluatedCr: tenant.total_spend_evaluated_inr || 428.5,
        totalIdentifiedSavingsCr: Number(totalIdentifiedSavingsCr.toFixed(2)),
        avgSavingsPct: Number(avgSavingsRatePct),
        totalLineItemsAudited: validationRecords.length,
        anomaliesResolved: validationRecords.filter((r) => r.resolved).length,
        topSavingsCategory: categories[0]?.name || 'Direct Materials'
      },
      categoryHighlights: categoryDetails.map((c) => ({
        category: c.category,
        total3YrSpendCr: c.total_3yr_spend_inr_cr,
        yoyGrowthPct: c.yoy_growth_pct,
        lineItemsCount: c.line_items_count
      })),
      topVendorRisks: vendorRankings.slice(0, 4).map((v) => ({
        vendor: v.vendor_name,
        priceCreepPct: v.price_creep_pct,
        leakageCr: v.variance_leakage_inr_cr,
        risk: v.risk_status
      })),
      topActionableOpportunities: opportunities.slice(0, 5)
    };

    return res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate report';
    return res.status(500).json({
      success: false,
      message
    });
  }
};
