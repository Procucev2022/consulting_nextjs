import { Request, Response } from 'express';
import { searchTaxonomy, lookupTaxonomy, getAllTaxonomyRecords } from '../services/taxonomyService';

export const getTaxonomyData = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const category = (req.query.category as string) || undefined;
    const lookup = req.query.lookup as string | undefined;

    if (lookup) {
      const match = lookupTaxonomy(lookup);
      return res.json({
        success: true,
        data: match || null,
        timestamp: new Date().toISOString()
      });
    }

    if (!query) {
      const sample = getAllTaxonomyRecords(30);
      return res.json({
        success: true,
        data: sample,
        total: sample.length,
        timestamp: new Date().toISOString()
      });
    }

    const results = searchTaxonomy(query, category);
    return res.json({
      success: true,
      data: results,
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search taxonomy'
    });
  }
};
