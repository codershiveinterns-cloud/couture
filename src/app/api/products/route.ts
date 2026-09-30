import { NextRequest } from 'next/server';
import { getProducts, parseProductQuery } from '@/lib/api';
import { MAX_QUERY_STRING_LENGTH, jsonError, jsonOk, rateLimitRequest } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const { blocked, headers } = rateLimitRequest(request);
  if (blocked) return blocked;

  if (request.nextUrl.search.length > MAX_QUERY_STRING_LENGTH) {
    return jsonError('Query string too long', 400, headers);
  }

  try {
    // parseProductQuery clamps every value (page, pageSize <= 48, list lengths, query length).
    const result = await getProducts(parseProductQuery(request.nextUrl.searchParams));
    return jsonOk(result, headers);
  } catch {
    return jsonError('Failed to fetch products', 500, headers);
  }
}
