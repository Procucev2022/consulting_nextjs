import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const vendorRankings = db.getVendorRankings();
    const vendorDetails = db.getVendorDetails();
    return NextResponse.json({
      success: true,
      data: {
        vendorRankings,
        vendorDetails,
        totalVolatileSpendCr: vendorRankings.reduce((sum, v) => sum + (v.total_spend_inr_cr || 0), 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch vendor analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetName, masterId, canonicalName } = body;
    if (!targetName || !masterId || !canonicalName) {
      return NextResponse.json({ success: false, message: 'Missing vendor merge parameters' }, { status: 400 });
    }
    const result = db.mergeVendor(targetName, masterId, canonicalName);
    return NextResponse.json({
      success: true,
      data: result,
      message: `Merged ${result.affected} records to master supplier ${canonicalName} (${masterId})`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to merge vendor' },
      { status: 400 }
    );
  }
}
