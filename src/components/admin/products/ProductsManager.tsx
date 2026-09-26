'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import { Button, Checkbox, EmptyState, Input, Modal, Select } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useCatalog } from '@/hooks/useCatalog';
import { formatPrice } from '@/lib/format';
import type { ProductRecord, ProductStatus } from '@/lib/mockTypes';
import {
  deleteProduct,
  getBaseProductById,
  productStatus,
  productStockLevel,
  setProductStatus,
  totalStock,
  updateProduct,
  type StockLevel,
} from '@/lib/services/catalogStore';
import {
  AdminThumb,
  discountPercent,
  FOCUS_RING,
  ROW_ACTION,
  ROW_ACTION_DANGER,
  SearchIcon,
  STOCK_META,
  TableSkeleton,
} from './shared';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | ProductStatus;
type StockFilter = 'all' | 'in' | 'low' | 'out';
type SortKey = 'newest' | 'name' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';

const STOCK_FILTER_LEVEL: Record<Exclude<StockFilter, 'all'>, StockLevel> = {
  in: 'in_stock',
  low: 'low_stock',
  out: 'out_of_stock',
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'stock-asc', label: 'Stock: low to high' },
  { value: 'stock-desc', label: 'Stock: high to low' },
];

function sortProducts(list: ProductRecord[], sort: SortKey): ProductRecord[] {
  switch (sort) {
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'stock-asc':
      return list.sort((a, b) => totalStock(a) - totalStock(b));
    case 'stock-desc':
      return list.sort((a, b) => totalStock(b) - totalStock(a));
    default:
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/** Storefront PDPs are server-rendered from the base catalog, so only published base products have a page. */
function storeHref(product: ProductRecord): string | null {
  if (productStatus(product) !== 'published') return null;
  const base = getBaseProductById(product.id);
  return base ? `/products/${base.slug}` : null;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5l2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.9l6-.9L12 3.5z" strokeLinejoin="round" />
    </svg>
  );
}

type PendingDelete = { kind: 'one'; product: ProductRecord } | { kind: 'bulk'; ids: string[] };

export function ProductsManager() {
  const { products, categories, isHydrated } = useCatalog();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [stock, setStock] = useState<StockFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [pageState, setPageState] = useState(1);
  const [selectedState, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (categoryId && p.categoryId !== categoryId) return false;
      if (status !== 'all' && productStatus(p) !== status) return false;
      if (stock !== 'all' && productStockLevel(p) !== STOCK_FILTER_LEVEL[stock]) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(term))
      );
    });
    return sortProducts(list, sort);
  }, [products, search, categoryId, status, stock, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pageState, pageCount);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Drop selections that no longer exist (deleted here or in another tab).
  const selected = useMemo(() => {
    const ids = new Set(products.map((p) => p.id));
    return new Set([...selectedState].filter((id) => ids.has(id)));
  }, [products, selectedState]);
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((p) => selected.has(p.id));
  const hasFilters = !!search.trim() || !!categoryId || status !== 'all' || stock !== 'all';

  const withReset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPageState(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('all');
    setStock('all');
    setPageState(1);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const togglePage = () => {
    const next = new Set(selected);
    pageItems.forEach((p) => (allOnPageSelected ? next.delete(p.id) : next.add(p.id)));
    setSelected(next);
  };

  const changeStatus = (product: ProductRecord, nextStatus: ProductStatus) => {
    const result = setProductStatus(product.id, nextStatus);
    if (!result.ok) {
      toast.error(result.fieldErrors?.images ?? result.error);
      return;
    }
    toast.success(nextStatus === 'published' ? `"${product.name}" is now live` : `"${product.name}" moved to drafts`);
  };

  const toggleFeatured = (product: ProductRecord) => {
    const result = updateProduct(product.id, { isFeatured: !product.isFeatured });
    if (!result.ok) toast.error(result.error);
    else toast.success(result.data.isFeatured ? `"${product.name}" is now featured` : `"${product.name}" is no longer featured`);
  };

  const bulkStatus = (nextStatus: ProductStatus) => {
    let done = 0;
    const failures: string[] = [];
    selected.forEach((id) => {
      const result = setProductStatus(id, nextStatus);
      if (result.ok) done += 1;
      else failures.push(result.fieldErrors?.images ?? result.error);
    });
    const verb = nextStatus === 'published' ? 'published' : 'unpublished';
    if (done > 0) toast.success(`${done} product${done === 1 ? '' : 's'} ${verb}`);
    if (failures.length > 0) {
      toast.error(`${failures.length} product${failures.length === 1 ? '' : 's'} could not be ${verb}`, { description: failures[0] });
    }
    setSelected(new Set());
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'one') {
      const result = deleteProduct(pendingDelete.product.id);
      if (result.ok) toast.success(`"${pendingDelete.product.name}" deleted`);
      else toast.error(result.error);
    } else {
      let done = 0;
      let failed = 0;
      pendingDelete.ids.forEach((id) => (deleteProduct(id).ok ? (done += 1) : (failed += 1)));
      if (done > 0) toast.success(`${done} product${done === 1 ? '' : 's'} deleted`);
      if (failed > 0) toast.error(`${failed} product${failed === 1 ? '' : 's'} could not be deleted`);
      setSelected(new Set());
    }
    setPendingDelete(null);
  };

  const deleteCount = pendingDelete?.kind === 'bulk' ? pendingDelete.ids.length : 1;

  return (
    <AdminPage
      title="Products"
      description="Create, edit, publish and organise everything in your catalog."
      actions={<Button href="/admin/products/new" size="sm">Add product</Button>}
    >
      <AdminCard padded={false}>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <Input
            type="search"
            aria-label="Search products"
            placeholder="Search name, SKU or brand"
            value={search}
            onChange={(event) => withReset(setSearch)(event.target.value)}
            leadingIcon={<SearchIcon />}
          />
          <Select aria-label="Filter by category" value={categoryId} onChange={(event) => withReset(setCategoryId)(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Filter by status" value={status} onChange={(event) => withReset(setStatus)(event.target.value as StatusFilter)}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
          <Select aria-label="Filter by stock" value={stock} onChange={(event) => withReset(setStock)(event.target.value as StockFilter)}>
            <option value="all">All stock states</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
          <Select aria-label="Sort products" value={sort} onChange={(event) => withReset(setSort)(event.target.value as SortKey)} options={SORT_OPTIONS} />
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-light px-4 py-2.5" role="region" aria-label="Bulk actions">
            <span className="mr-2 text-[13px] font-bold text-ink">{selected.size} selected</span>
            <Button size="sm" variant="secondary" onClick={() => bulkStatus('published')}>
              Publish
            </Button>
            <Button size="sm" variant="secondary" onClick={() => bulkStatus('draft')}>
              Unpublish
            </Button>
            <Button size="sm" variant="danger" onClick={() => setPendingDelete({ kind: 'bulk', ids: [...selected] })}>
              Delete
            </Button>
            <button type="button" onClick={() => setSelected(new Set())} className={`${ROW_ACTION} ml-auto`}>
              Clear
            </button>
          </div>
        )}

        {!isHydrated ? (
          <TableSkeleton rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="border-0"
            title={hasFilters ? 'No products match these filters' : 'No products yet'}
            description={hasFilters ? 'Try a different search term or clear the filters.' : 'Add your first product to start selling.'}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button href="/admin/products/new">Add product</Button>
              )
            }
          />
        ) : (
          <>
            <div className={ADMIN_TABLE.wrap}>
              <table className={`${ADMIN_TABLE.table} min-w-[980px]`}>
                <caption className="sr-only">Products</caption>
                <thead>
                  <tr>
                    <th scope="col" className={`${ADMIN_TABLE.th} w-10`}>
                      <Checkbox
                        label={<span className="sr-only">Select all products on this page</span>}
                        checked={allOnPageSelected}
                        onChange={togglePage}
                      />
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>Product</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Category</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Price</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Stock</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Status</th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-center`}>Featured</th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((product) => {
                    const published = productStatus(product) === 'published';
                    const level = STOCK_META[productStockLevel(product)];
                    const off = discountPercent(product.price, product.compareAtPrice);
                    const href = storeHref(product);
                    return (
                      <tr key={product.id} className={`${ADMIN_TABLE.row} ${selected.has(product.id) ? 'bg-brand-light/40' : ''}`}>
                        <td className={ADMIN_TABLE.td}>
                          <Checkbox
                            label={<span className="sr-only">Select {product.name}</span>}
                            checked={selected.has(product.id)}
                            onChange={() => toggleOne(product.id)}
                          />
                        </td>
                        <td className={ADMIN_TABLE.td}>
                          <div className="flex items-center gap-3">
                            <AdminThumb url={product.images[0]?.url} alt="" />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/products/${product.id}`}
                                className={`block max-w-[280px] truncate rounded-sm font-bold text-ink hover:text-brand ${FOCUS_RING}`}
                              >
                                {product.name}
                              </Link>
                              <p className="text-[12px] text-ink-3">
                                {product.sku}
                                {product.brand ? ` · ${product.brand}` : ''}
                                {product.variants.length > 0 ? ` · ${product.variants.length} variants` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={ADMIN_TABLE.td}>{product.categoryName || '—'}</td>
                        <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>
                          <span className="font-bold text-ink">{formatPrice(product.price)}</span>
                          {off !== null && product.compareAtPrice !== null && (
                            <span className="block text-[12px]">
                              <s className="text-ink-4">{formatPrice(product.compareAtPrice)}</s>{' '}
                              <span className="font-bold text-discount">({off}% OFF)</span>
                            </span>
                          )}
                        </td>
                        <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>
                          <span className="mr-2 font-bold tabular-nums text-ink">{totalStock(product)}</span>
                          <StatusPill tone={level.tone}>{level.label}</StatusPill>
                        </td>
                        <td className={ADMIN_TABLE.td}>
                          <StatusPill tone={published ? 'success' : 'neutral'}>{published ? 'Published' : 'Draft'}</StatusPill>
                        </td>
                        <td className={`${ADMIN_TABLE.td} text-center`}>
                          <button
                            type="button"
                            onClick={() => toggleFeatured(product)}
                            aria-pressed={product.isFeatured}
                            aria-label={product.isFeatured ? `Remove ${product.name} from featured` : `Feature ${product.name}`}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors hover:bg-surface ${FOCUS_RING} ${
                              product.isFeatured ? 'text-[#f5a623]' : 'text-ink-4'
                            }`}
                          >
                            <StarIcon filled={product.isFeatured} />
                          </button>
                        </td>
                        <td className={`${ADMIN_TABLE.td} whitespace-nowrap text-right`}>
                          <Link href={`/admin/products/${product.id}`} className={ROW_ACTION}>
                            Edit
                          </Link>
                          <button type="button" className={ROW_ACTION} onClick={() => changeStatus(product, published ? 'draft' : 'published')}>
                            {published ? 'Unpublish' : 'Publish'}
                          </button>
                          {href && (
                            <a href={href} target="_blank" rel="noreferrer" className={ROW_ACTION} aria-label={`View ${product.name} in store (opens in a new tab)`}>
                              View in store ↗
                            </a>
                          )}
                          <button
                            type="button"
                            className={ROW_ACTION_DANGER}
                            aria-label={`Delete ${product.name}`}
                            onClick={() => setPendingDelete({ kind: 'one', product })}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <nav aria-label="Products pagination" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="text-[13px] text-ink-3" aria-live="polite">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPageState(page - 1)}>
                  Previous
                </Button>
                <span className="text-[13px] tabular-nums text-ink-2">
                  Page {page} of {pageCount}
                </span>
                <Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => setPageState(page + 1)}>
                  Next
                </Button>
              </div>
            </nav>
          </>
        )}
      </AdminCard>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        size="sm"
        title={deleteCount === 1 ? 'Delete product?' : `Delete ${deleteCount} products?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          {pendingDelete?.kind === 'one' ? (
            <>
              <strong className="text-ink">{pendingDelete.product.name}</strong> will be removed from the catalog, shoppers&apos; bags and
              wishlists. Past orders keep their copy. This cannot be undone.
            </>
          ) : (
            <>The selected products will be removed from the catalog, shoppers&apos; bags and wishlists. This cannot be undone.</>
          )}
        </p>
      </Modal>
    </AdminPage>
  );
}

export default ProductsManager;
