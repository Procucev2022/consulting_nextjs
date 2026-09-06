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
