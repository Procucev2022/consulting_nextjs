import { NextResponse } from 'next/server';
import { getAllFXRates, getFXRate, convertAmount } from '@/lib/currencyService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const amountStr = searchParams.get('amount');
    const yearStr = searchParams.get('year');

    if (from && amountStr) {
      const amount = parseFloat(amountStr) || 0;
      const year = yearStr ? parseInt(yearStr, 10) : undefined;
      const conversion = convertAmount(amount, from, year);
      return NextResponse.json({
        success: true,
        data: conversion,
        timestamp: new Date().toISOString()
      });
    }

    const rates = getAllFXRates();
    return NextResponse.json({
      success: true,
      data: rates,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch currency rates' },
      { status: 500 }
    );
  }
}
