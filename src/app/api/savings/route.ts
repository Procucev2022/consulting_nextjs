import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const opportunities = db.getOpportunities();
    const totalPotentialSavingsCr = opportunities.reduce((sum, o) => sum + (o.est_savings_inr_cr || 0), 0);
    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        totalPotentialSavingsCr,
        count: opportunities.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch savings opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { opp_id, targetModule } = body;
    if (!opp_id || !targetModule) {
      return NextResponse.json({ success: false, message: 'Missing opp_id or targetModule' }, { status: 400 });
    }
    const updated = db.deployOpportunity(opp_id, targetModule);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Opportunity not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Opportunity ${opp_id} successfully deployed to ${targetModule}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to deploy opportunity' },
      { status: 400 }
    );
  }
}
