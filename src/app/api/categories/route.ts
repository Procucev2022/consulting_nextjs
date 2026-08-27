import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (categoryId) {
      const detail = db.getCategoryById(categoryId);
      if (!detail) {
        return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: detail, timestamp: new Date().toISOString() });
    }

    const categories = db.getCategories();
    const categoryDetails = db.getCategoryDetails();
    return NextResponse.json({
      success: true,
      data: {
        categories,
        categoryDetails,
        total3YrSpendCr: categoryDetails.reduce((sum, c) => sum + (c.total_3yr_spend_inr_cr || 0), 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
