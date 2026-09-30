import { NextRequest } from 'next/server';
import { getProductBySlug } from '@/lib/api';
import { isValidSlug, jsonError, jsonOk, rateLimitRequest } from '@/lib/rateLimit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { blocked, headers } = rateLimitRequest(request);
  if (blocked) return blocked;

  try {
    const { slug } = await params;
    if (!isValidSlug(slug)) return jsonError('Product not found', 404, headers);

    const product = await getProductBySlug(slug);
    if (!product) return jsonError('Product not found', 404, headers);
    return jsonOk({ success: true, data: product }, headers);
  } catch {
    return jsonError('Failed to fetch product', 500, headers);
  }
}
