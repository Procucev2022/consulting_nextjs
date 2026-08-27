import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const funnelStages = db.getFunnelStages();
    return NextResponse.json({
      success: true,
      data: funnelStages,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch conversion stages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { annualSpendCr = 428.5, savingsRate = 9.4, saasFeeRate = 0.85 } = body;

    const grossSavingsCr = (annualSpendCr * savingsRate) / 100;
    const platformFeeCr = (annualSpendCr * saasFeeRate) / 100;
    const netClientBenefitCr = grossSavingsCr - platformFeeCr;
    const roiMultiple = grossSavingsCr / (platformFeeCr || 1);

    return NextResponse.json({
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to calculate commercial metrics' },
      { status: 400 }
    );
  }
}
