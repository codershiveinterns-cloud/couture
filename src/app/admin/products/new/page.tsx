'use client';

import { AdminPage } from '@/components/admin/AdminPage';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { Button } from '@/components/ui';

export default function AdminNewProductPage() {
  return (
    <AdminPage
      title="Add product"
      description="New products start as drafts until you publish them."
      actions={
        <Button href="/admin/products" variant="secondary" size="sm">
          Back to products
        </Button>
      }
    >
      <ProductForm />
    </AdminPage>
  );
}
