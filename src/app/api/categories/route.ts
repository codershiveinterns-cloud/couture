import { NextRequest } from 'next/server';
import { getCategories } from '@/lib/api';
import { jsonError, jsonOk, rateLimitRequest } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const { blocked, headers } = rateLimitRequest(request);
  if (blocked) return blocked;

  try {
    const categories = await getCategories();
    return jsonOk({ success: true, data: categories }, headers);
  } catch {
    return jsonError('Failed to fetch categories', 500, headers);
  }
}
