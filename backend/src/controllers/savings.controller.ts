import { Request, Response } from 'express';
import { db } from '../services/db';

export const getSavings = async (_req: Request, res: Response) => {
  try {
    const opportunities = db.getOpportunities();
    const totalPotentialSavingsCr = opportunities.reduce((sum, o) => sum + (o.est_savings_inr_cr || 0), 0);
    return res.json({
      success: true,
      data: {
        opportunities,
        totalPotentialSavingsCr,
        count: opportunities.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch savings opportunities'
    });
  }
};

export const deployOpportunity = async (req: Request, res: Response) => {
  try {
    const { opp_id, targetModule } = req.body;
    if (!opp_id || !targetModule) {
      return res.status(400).json({ success: false, message: 'Missing opp_id or targetModule' });
    }
    const updated = db.deployOpportunity(opp_id, targetModule);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    return res.json({
      success: true,
      data: updated,
      message: `Opportunity ${opp_id} successfully deployed to ${targetModule}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to deploy opportunity'
    });
  }
};
