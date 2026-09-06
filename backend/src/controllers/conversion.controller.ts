import type { Request, Response } from 'express';
import { db } from '../services/db';

export const getConversionStages = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const funnelStages = db.getFunnelStages();
    return res.json({
      success: true,
      data: funnelStages,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch conversion stages';
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const calculateConversionMetrics = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { annualSpendCr = 428.5, savingsRate = 9.4, saasFeeRate = 0.85 } = req.body;

    const grossSavingsCr = (annualSpendCr * savingsRate) / 100;
    const platformFeeCr = (annualSpendCr * saasFeeRate) / 100;
    const netClientBenefitCr = grossSavingsCr - platformFeeCr;
    const roiMultiple = grossSavingsCr / (platformFeeCr || 1);

    return res.json({
      success: true,
      data: {
        annualSpendCr,
        savingsRate,
        saasFeeRate,
        grossSavingsCr: Number(grossSavingsCr.toFixed(2)),
        platformFeeCr: Number(platformFeeCr.toFixed(2)),
        netClientBenefitCr: Number(netClientBenefitCr.toFixed(2)),
        roiMultiple: Number(roiMultiple.toFixed(2))
      },
      message: 'Commercial SaaS realization metrics calculated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to calculate commercial metrics';
    return res.status(400).json({
      success: false,
      message
    });
  }
};
