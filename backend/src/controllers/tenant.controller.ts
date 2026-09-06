import type { Request, Response } from 'express';
import { db } from '../services/db';
import logger from '../utils/logger';

export const getTenant = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const tenant = db.getTenant();
    logger.debug('Fetched tenant master details', { tenantId: tenant.tenant_id });
    return res.json({
      success: true,
      data: tenant,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tenant';
    logger.error('Failed to fetch tenant', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const updateTenant = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const body = req.body;
    const updated = db.updateTenant(body);
    logger.info('Tenant settings updated successfully', {
      tenantId: updated.tenant_id,
      region: updated.region,
      baseCurrency: updated.base_currency
    });
    return res.json({
      success: true,
      data: updated,
      message: 'Tenant settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update tenant';
    logger.error('Failed to update tenant', { body: req.body }, error);
    return res.status(400).json({
      success: false,
      message
    });
  }
};
