'use client';

import { AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import { Button, EmptyState } from '@/components/ui';
import { useCatalog } from '@/hooks/useCatalog';
import { getBaseProductById, productStatus } from '@/lib/services/catalogStore';
import { ProductForm } from './ProductForm';

const backButton = (
  <Button href="/admin/products" variant="secondary" size="sm">
    Back to products
  </Button>
);

export function ProductEditor({ productId }: { productId: string }) {
  const { getProduct, isHydrated } = useCatalog();
  const product = isHydrated ? getProduct(productId) : undefined;

  if (!isHydrated) {
    return (
      <AdminPage title="Edit product" actions={backButton}>
        <div role="status" aria-label="Loading product" className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <AdminCard>
            <div className="h-72 animate-pulse rounded-sm bg-surface" />
          </AdminCard>
          <AdminCard>
            <div className="h-72 animate-pulse rounded-sm bg-surface" />
          </AdminCard>
        </div>
      </AdminPage>
    );
  }

  if (!product) {
    return (
      <AdminPage title="Product not found" actions={backButton}>
        <EmptyState
          title="We couldn't find that product"
          description="It may have been deleted, or the link is incorrect."
          action={<Button href="/admin/products">Back to products</Button>}
        />
      </AdminPage>
    );
  }

  const published = productStatus(product) === 'published';
  const base = published ? getBaseProductById(product.id) : undefined;

  return (
    <AdminPage
      title={product.name}
      description={`SKU ${product.sku} · /${product.slug}`}
      actions={
        <>
          <StatusPill tone={published ? 'success' : 'neutral'}>{published ? 'Published' : 'Draft'}</StatusPill>
          {base && (
            <Button href={`/products/${base.slug}`} target="_blank" rel="noreferrer" variant="secondary" size="sm">
              View in store ↗
            </Button>
          )}
          {backButton}
        </>
      }
    >
      <ProductForm key={product.id} product={product} />
    </AdminPage>
  );
}

export default ProductEditor;
