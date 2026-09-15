import { NextRequest, NextResponse } from 'next/server';
import { getRelatedProducts } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const related = await getRelatedProducts(slug);
    return NextResponse.json({ success: true, data: related });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related products' },
      { status: 500 }
    );
  }
}
