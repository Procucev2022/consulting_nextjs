import type { Request, Response } from 'express';
import { db } from '../services/db';
import logger from '../utils/logger';

export const getVendors = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const vendorRankings = db.getVendorRankings();
    const vendorDetails = db.getVendorDetails();
    logger.debug('Fetched vendor rankings and details', {
      vendorCount: vendorRankings.length
    });
    return res.json({
      success: true,
      data: {
        vendorRankings,
        vendorDetails,
        totalVolatileSpendCr: vendorRankings.reduce((sum, v) => sum + (v.total_spend_inr_cr || 0), 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vendor analytics';
    logger.error('Failed to fetch vendor analytics', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const mergeVendor = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { targetName, masterId, canonicalName } = req.body;
    if (!targetName || !masterId || !canonicalName) {
      logger.warn('Vendor merge rejected: Missing parameters', { body: req.body });
      return res.status(400).json({ success: false, message: 'Missing vendor merge parameters' });
    }
    const result = db.mergeVendor(targetName, masterId, canonicalName);
    logger.info('Vendor merged into master supplier', {
      targetName,
      masterId,
      canonicalName,
      affectedRecords: result.affected
    });
    return res.json({
      success: true,
      data: result,
      message: `Merged ${result.affected} records to master supplier ${canonicalName} (${masterId})`,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to merge vendor';
    logger.error('Failed to merge vendor', { body: req.body }, error);
    return res.status(400).json({
      success: false,
      message
    });
  }
};
