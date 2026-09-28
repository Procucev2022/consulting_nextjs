import type { Request, Response } from 'express';
import { db } from '../services/db';
import logger from '../utils/logger';

export const getSavings = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const opportunities = db.getOpportunities();
    const totalPotentialSavingsCr = opportunities.reduce((sum, o) => sum + (o.est_savings_inr_cr || 0), 0);
    logger.debug('Fetched savings opportunities', { count: opportunities.length, totalPotentialSavingsCr });
    return res.json({
      success: true,
      data: {
        opportunities,
        totalPotentialSavingsCr,
        count: opportunities.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch savings opportunities';
    logger.error('Failed to fetch savings opportunities', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const deployOpportunity = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { opp_id: oppId, targetModule } = req.body;
    if (!oppId || !targetModule) {
      logger.warn('Deploy opportunity rejected: Missing opp_id or targetModule', { body: req.body });
      return res.status(400).json({ success: false, message: 'Missing opp_id or targetModule' });
    }
    const updated = db.deployOpportunity(oppId, targetModule);
    if (!updated) {
      logger.warn('Opportunity not found for deployment', { oppId });
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    logger.info('Savings opportunity deployed', { oppId, targetModule });
    return res.json({
      success: true,
      data: updated,
      message: `Opportunity ${oppId} successfully deployed to ${targetModule}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to deploy opportunity';
    logger.error('Failed to deploy opportunity', { body: req.body }, error);
    return res.status(400).json({
      success: false,
      message
    });
  }
};

/**
 * Module 4 Consolidated Savings & De-Duplication API Endpoint (Prompt 100)
 */
export const getConsolidatedSavings = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const consolidated = db.getConsolidatedSavings();
    logger.info('Fetched consolidated savings with overlap de-duplication', {
      opportunitiesCount: consolidated.opportunities.length,
      overlapsCount: consolidated.overlaps.length,
      netPotentialSavingsCr: consolidated.waterfallMetrics.net_potential_savings_inr_cr
    });
    return res.json({
      success: true,
      data: consolidated,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate consolidated savings';
    logger.error('Failed to generate consolidated savings', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

/**
 * Action Plan Update Endpoint (Module 4)
 */
export const updateActionPlan = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { actionId, status, owner, priority, comments } = req.body;
    const updated = db.updateActionPlan(actionId, { status, owner, priority, comments });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Action plan ${actionId} not found`
      });
    }
    logger.info('Action plan updated', { actionId, status, owner });
    return res.json({
      success: true,
      data: updated,
      message: `Action plan ${actionId} updated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update action plan';
    logger.error('Failed to update action plan', { body: req.body }, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

/**
 * Savings Opportunity Status Update Endpoint (Module 4)
 */
export const updateOpportunityStatus = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { opp_id: oppId, status } = req.body;
    const updated = db.updateSavingsOpportunityStatus(oppId, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Savings opportunity ${oppId} not found`
      });
    }
    logger.info('Opportunity status updated', { oppId, status });
    return res.json({
      success: true,
      data: updated,
      message: `Opportunity ${oppId} moved to status ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update opportunity status';
    logger.error('Failed to update opportunity status', { body: req.body }, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};
