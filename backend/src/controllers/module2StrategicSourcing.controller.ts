/**
 * Module 2 — Strategic Sourcing Intelligence Controller
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type { Request, Response } from 'express';
import { db } from '../services/db';
import { logger } from '../utils/logger';

export const getDashboardSummary = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const analysis = db.getModule2StrategicSourcingAnalysis(forceRefresh);
    logger.info('Module 2 Sourcing Dashboard fetched', {
      addressableSpendCr: analysis.summary.totalAddressableSpendInrCr,
      netOpportunityCr: analysis.summary.netQuantifiableOpportunityInrCr
    });
    return res.json({
      success: true,
      data: analysis.summary,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sourcing dashboard summary';
    logger.error('Failed to fetch sourcing dashboard summary', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getCategoryProfiles = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const analysis = db.getModule2StrategicSourcingAnalysis(forceRefresh);
    logger.info('Module 2 Category Sourcing Profiles fetched', { count: analysis.profiles.length });
    return res.json({
      success: true,
      data: {
        profiles: analysis.profiles,
        count: analysis.profiles.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch category profiles';
    logger.error('Failed to fetch category profiles', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getCategoryProfileById = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Category identifier is required' });
    }
    const profile = db.getModule2StrategicProfile(id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Category sourcing profile not found for identifier '${id}'`
      });
    }
    logger.info('Module 2 Category Deep-Dive profile fetched', {
      categoryId: profile.categoryId,
      categoryName: profile.categoryName
    });
    return res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch category profile';
    logger.error('Failed to fetch category profile by ID', { id: req.params.id }, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getSupplierDeepDive = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const analysis = db.getModule2StrategicSourcingAnalysis();
    const supplierAgg = new Map<string, {
      supplierName: string;
      categories: string[];
      totalSpendInr: number;
      totalTransactions: number;
      potentialConsolidationRelevance: string;
    }>();

    for (const p of analysis.profiles) {
      for (const s of p.suppliers) {
        const existing = supplierAgg.get(s.supplierName) || {
          supplierName: s.supplierName,
          categories: [],
          totalSpendInr: 0,
          totalTransactions: 0,
          potentialConsolidationRelevance: s.potentialConsolidationRelevance
        };
        if (!existing.categories.includes(p.categoryName)) {
          existing.categories.push(p.categoryName);
        }
        existing.totalSpendInr += s.totalSpendInr;
        existing.totalTransactions += s.transactionCount;
        supplierAgg.set(s.supplierName, existing);
      }
    }

    const suppliersList = Array.from(supplierAgg.values()).sort((a, b) => b.totalSpendInr - a.totalSpendInr);
    return res.json({
      success: true,
      data: {
        suppliers: suppliersList,
        count: suppliersList.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch supplier deep dive';
    logger.error('Failed to fetch supplier deep dive', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getHandoffPackages = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const packages = db.getModule2HandoffPackages();
    return res.json({
      success: true,
      data: {
        packages,
        count: packages.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch handoff packages';
    logger.error('Failed to fetch handoff packages', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const exportSourcingReport = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const analysis = db.getModule2StrategicSourcingAnalysis();
    const exportData = {
      exportVersion: 'MODULE_2_SOURCING_LOGIC_V1.0',
      exportedAt: new Date().toISOString(),
      summary: analysis.summary,
      profiles: analysis.profiles.map(p => ({
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        totalSpendInr: p.totalSpendInr,
        addressableSpendInr: p.addressableSpendInr,
        eauctionSuitability: p.eauctionSuitability,
        potentialEAuctionOpportunityInr: p.potentialEAuctionOpportunityInr,
        consolidationSuitability: p.consolidationSuitability,
        potentialVendorConsolidationOpportunityInr: p.potentialVendorConsolidationOpportunityInr,
        overlappingOpportunityInr: p.overlappingOpportunityInr,
        netQuantifiableOpportunityInr: p.netQuantifiableOpportunityInr,
        scorecardScore: p.scorecard.overallScore,
        strategyRecommendation: p.scorecard.recommendation,
        confidence: p.dataConfidence,
        exclusionsCount: p.excludedTransactionCount,
        exclusions: p.exclusions,
        auditTrail: {
          calculationId: p.calculationId,
          version: p.calculationVersion,
          timestamp: p.calculationTimestamp
        }
      }))
    };
    return res.json({
      success: true,
      data: exportData,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export sourcing report';
    logger.error('Failed to export sourcing report', {}, error);
    return res.status(500).json({ success: false, message });
  }
};
