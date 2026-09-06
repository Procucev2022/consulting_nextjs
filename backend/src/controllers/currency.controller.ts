import type { Request, Response } from 'express';
import { getAllFXRates, convertAmount } from '../services/currencyService';
import logger from '../utils/logger';

export const getCurrencyData = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const from = req.query.from as string | undefined;
    const amountStr = req.query.amount as string | undefined;
    const yearStr = req.query.year as string | undefined;

    if (from && amountStr) {
      const amount = parseFloat(amountStr) || 0;
      const year = yearStr ? parseInt(yearStr, 10) : undefined;
      const conversion = convertAmount(amount, from, year);
      logger.debug('Currency converted', { from, amount, year, inr: conversion.amountINR });
      return res.json({
        success: true,
        data: conversion,
        timestamp: new Date().toISOString()
      });
    }

    const rates = getAllFXRates();
    logger.debug('Fetched all FX rates', { count: Object.keys(rates).length });
    return res.json({
      success: true,
      data: rates,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch currency rates';
    logger.error('Failed to fetch currency rates', { query: req.query }, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};
