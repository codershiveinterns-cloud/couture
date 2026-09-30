import { NextRequest } from 'next/server';
import { getProductBySlug, getRelatedProducts } from '@/lib/api';
import { isValidSlug, jsonError, jsonOk, rateLimitRequest } from '@/lib/rateLimit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { blocked, headers } = rateLimitRequest(request);
  if (blocked) return blocked;

  try {
    const { slug } = await params;
    if (!isValidSlug(slug)) return jsonError('Product not found', 404, headers);

    // Unknown products are a 404 rather than an empty 200 so clients can tell the cases apart.
    const product = await getProductBySlug(slug);
    if (!product) return jsonError('Product not found', 404, headers);

    const related = await getRelatedProducts(slug);
    return jsonOk({ success: true, data: related }, headers);
  } catch {
    return jsonError('Failed to fetch related products', 500, headers);
  }
}
