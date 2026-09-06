import { Request, Response } from 'express';
import { getAllFXRates, convertAmount } from '../services/currencyService';

export const getCurrencyData = async (req: Request, res: Response) => {
  try {
    const from = req.query.from as string | undefined;
    const amountStr = req.query.amount as string | undefined;
    const yearStr = req.query.year as string | undefined;

    if (from && amountStr) {
      const amount = parseFloat(amountStr) || 0;
      const year = yearStr ? parseInt(yearStr, 10) : undefined;
      const conversion = convertAmount(amount, from, year);
      return res.json({
        success: true,
        data: conversion,
        timestamp: new Date().toISOString()
      });
    }

    const rates = getAllFXRates();
    return res.json({
      success: true,
      data: rates,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch currency rates'
    });
  }
};
