import { Request, Response } from 'express';
import { db } from '../services/db';

export const getTenant = async (_req: Request, res: Response) => {
  try {
    const tenant = db.getTenant();
    res.json({
      success: true,
      data: tenant,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
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
    res.json({
      success: true,
      data: updated,
      message: 'Tenant settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update tenant'
    });
  }
};
