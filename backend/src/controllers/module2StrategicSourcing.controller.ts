/**
 * Module 2 — Strategic Sourcing Intelligence Controller
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type { Request, Response } from 'express';
import { db } from '../services/db';
import { logger } from '../utils/logger';

const handleControllerError = (res: Response, error: unknown, defaultMessage: string): Response => {
  const message = error instanceof Error ? error.message : defaultMessage;
  if (message.includes('not found') || message.includes('was not found')) {
    return res.status(404).json({ success: false, message });
  }
  if (
    message.includes('completed Module 1') ||
    message.includes('required') ||
    message.includes('active data version')
  ) {
    return res.status(400).json({ success: false, message });
  }
  return res.status(500).json({ success: false, message });
};

export const getDashboardSummary = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'Assessment identifier (assessmentId) is required' });
    }
    const forceRefresh = req.query.refresh === 'true';
    const analysis = db.getModule2StrategicSourcingAnalysis(assessmentId, forceRefresh);
    logger.info('Module 2 Sourcing Dashboard fetched', {
      assessmentId,
      addressableSpendCr: analysis.summary.totalAddressableSpendInrCr,
      netOpportunityCr: analysis.summary.netQuantifiableOpportunityInrCr
    });
    return res.json({
      success: true,
      data: analysis.summary,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch sourcing dashboard summary', {}, error);
    return handleControllerError(res, error, 'Failed to fetch sourcing dashboard summary');
  }
};

export const getCategoryProfiles = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'Assessment identifier (assessmentId) is required' });
    }
    const forceRefresh = req.query.refresh === 'true';
    const analysis = db.getModule2StrategicSourcingAnalysis(assessmentId, forceRefresh);
    logger.info('Module 2 Category Sourcing Profiles fetched', { assessmentId, count: analysis.profiles.length });
    return res.json({
      success: true,
      data: {
        profiles: analysis.profiles,
        count: analysis.profiles.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch category profiles', {}, error);
    return handleControllerError(res, error, 'Failed to fetch category profiles');
  }
};

export const getCategoryProfileById = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Category identifier is required' });
    }
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'Assessment identifier (assessmentId) is required' });
    }
    const profile = db.getModule2StrategicProfile(id, assessmentId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Category sourcing profile not found for identifier '${id}'`
      });
    }
    logger.info('Module 2 Category Deep-Dive profile fetched', {
      assessmentId,
      categoryId: profile.categoryId,
      categoryName: profile.categoryName
    });
    return res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch category profile by ID', { id: req.params.id }, error);
    return handleControllerError(res, error, 'Failed to fetch category profile');
  }
};

export const getSupplierDeepDive = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'Assessment identifier (assessmentId) is required' });
    }
    const analysis = db.getModule2StrategicSourcingAnalysis(assessmentId);
    const supplierAgg = new Map<
      string,
      {
        supplierName: string;
        categories: string[];
        totalSpendInr: number;
        totalTransactions: number;
        potentialConsolidationRelevance: string;
      }
    >();

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
    logger.error('Failed to fetch supplier deep dive', {}, error);
    return handleControllerError(res, error, 'Failed to fetch supplier deep dive');
  }
};

export const getHandoffPackages = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'Assessment identifier (assessmentId) is required' });
    }
    const packages = db.getModule2HandoffPackages(assessmentId);
    return res.json({
      success: true,
      data: {
        packages,
        count: packages.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch handoff packages', {}, error);
    return handleControllerError(res, error, 'Failed to fetch handoff packages');
  }
};

export const exportSourcingReport = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const assessmentId = (req.query.assessmentId as string)?.trim();
    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'Assessment identifier (assessmentId) is required' });
    }
    const analysis = db.getModule2StrategicSourcingAnalysis(assessmentId);
    const exportData = {
      exportVersion: 'MODULE_2_SOURCING_LOGIC_V1.0',
      exportedAt: new Date().toISOString(),
      summary: analysis.summary,
      profiles: analysis.profiles.map((p) => ({
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
    logger.error('Failed to export sourcing report', {}, error);
    return handleControllerError(res, error, 'Failed to export sourcing report');
  }
};
