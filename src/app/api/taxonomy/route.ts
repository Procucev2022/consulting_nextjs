import { NextResponse } from 'next/server';
import { searchTaxonomy, lookupTaxonomy, getAllTaxonomyRecords } from '@/lib/taxonomyService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const lookup = searchParams.get('lookup');

    if (lookup) {
      const match = lookupTaxonomy(lookup);
      return NextResponse.json({
        success: true,
        data: match || null,
        timestamp: new Date().toISOString()
      });
    }

    if (!query) {
      const sample = getAllTaxonomyRecords(30);
      return NextResponse.json({
        success: true,
        data: sample,
        total: sample.length,
        timestamp: new Date().toISOString()
      });
    }

    const results = searchTaxonomy(query, category);
    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search taxonomy' },
      { status: 500 }
    );
  }
}
