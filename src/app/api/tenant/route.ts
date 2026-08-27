import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tenant = db.getTenant();
    return NextResponse.json({
      success: true,
      data: tenant,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = db.updateTenant(body);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Tenant settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update tenant' },
      { status: 400 }
    );
  }
}
