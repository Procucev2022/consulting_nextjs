import { Request, Response } from 'express';
import { db } from '../services/db';
import logger from '../utils/logger';

export const getTenant = async (_req: Request, res: Response) => {
  try {
    const tenant = db.getTenant();
    logger.debug('Fetched tenant master details', { tenantId: tenant.tenant_id });
    res.json({
      success: true,
      data: tenant,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to fetch tenant', {}, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tenant'
    });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const updated = db.updateTenant(body);
    logger.info('Tenant settings updated successfully', {
      tenantId: updated.tenant_id,
      region: updated.region,
      baseCurrency: updated.base_currency
    });
    res.json({
      success: true,
      data: updated,
      message: 'Tenant settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to update tenant', { body: req.body }, error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update tenant'
    });
  }
};

