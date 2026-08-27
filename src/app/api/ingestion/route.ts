import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const queue = db.getIngestionQueue();
    const validationRecords = db.getValidationRecords();
    return NextResponse.json({
      success: true,
      data: {
        queue,
        validationRecords,
        summary: {
          totalFiles: queue.length,
          totalRecords: validationRecords.length,
          cleanCount: validationRecords.filter((r) => r.issue_flag === 'Passed Clean').length,
          anomaliesCount: validationRecords.filter((r) => r.issue_flag !== 'Passed Clean').length,
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch ingestion data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updatedQueue = db.addIngestionItem(body);
    return NextResponse.json({
      success: true,
      data: updatedQueue,
      message: 'File ingested successfully into queue',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add ingestion file' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { record_id, ...updates } = body;
    if (!record_id) {
      return NextResponse.json({ success: false, message: 'Missing record_id' }, { status: 400 });
    }
    const updated = db.updateValidationRecord(record_id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Record ${record_id} updated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update validation record' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  try {
    const reset = db.resetValidationRecords();
    return NextResponse.json({
      success: true,
      data: reset,
      message: 'Validation records reset to baseline',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reset records' },
      { status: 500 }
    );
  }
}
