import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const result = db.applyBlanketRemediation();
    return NextResponse.json({
      success: true,
      data: result,
      message: `Blanket AI remediation applied to ${result.updatedCount} anomalous records. All spend normalized in INR Crores.`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to apply blanket remediation' },
      { status: 500 }
    );
  }
}
