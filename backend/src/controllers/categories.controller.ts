import type { Request, Response } from 'express';
import { db } from '../services/db';

export const getCategories = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const categoryId = req.query.id as string | undefined;

    if (categoryId) {
      const detail = db.getCategoryById(categoryId);
      if (!detail) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      return res.json({ success: true, data: detail, timestamp: new Date().toISOString() });
    }

    const categories = db.getCategories();
    const categoryDetails = db.getCategoryDetails();
    return res.json({
      success: true,
      data: {
        categories,
        categoryDetails,
        total3YrSpendCr: categoryDetails.reduce((sum, c) => sum + (c.total_3yr_spend_inr_cr || 0), 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    return res.status(500).json({
      success: false,
      message
    });
  }
};
