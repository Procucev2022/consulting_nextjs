import { Request, Response } from 'express';
import { db } from '../services/db';

export const getVendors = async (_req: Request, res: Response) => {
  try {
    const vendorRankings = db.getVendorRankings();
    const vendorDetails = db.getVendorDetails();
    return res.json({
      success: true,
      data: {
        vendorRankings,
        vendorDetails,
        totalVolatileSpendCr: vendorRankings.reduce((sum, v) => sum + (v.total_spend_inr_cr || 0), 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch vendor analytics'
    });
  }
};

export const mergeVendor = async (req: Request, res: Response) => {
  try {
    const { targetName, masterId, canonicalName } = req.body;
    if (!targetName || !masterId || !canonicalName) {
      return res.status(400).json({ success: false, message: 'Missing vendor merge parameters' });
    }
    const result = db.mergeVendor(targetName, masterId, canonicalName);
    return res.json({
      success: true,
      data: result,
      message: `Merged ${result.affected} records to master supplier ${canonicalName} (${masterId})`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to merge vendor'
    });
  }
};
