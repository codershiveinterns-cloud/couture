'use client';

import { useParams } from 'next/navigation';
import { ProductEditor } from '@/components/admin/products/ProductEditor';

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  return <ProductEditor productId={decodeURIComponent(params.id)} />;
}
