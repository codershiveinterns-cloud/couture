import { NextRequest, NextResponse } from 'next/server';
import { getProducts, parseProductQuery } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const result = await getProducts(parseProductQuery(request.nextUrl.searchParams));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
