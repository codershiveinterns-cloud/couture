'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import { AdminThumb, FOCUS_RING, ROW_ACTION, SearchIcon, STOCK_META, TableSkeleton } from '@/components/admin/products/shared';
import { Button, EmptyState, Input, QuantityStepper } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useCatalog } from '@/hooks/useCatalog';
import type { ProductRecord, ProductVariantRecord } from '@/lib/mockTypes';
import {
  LOW_STOCK_THRESHOLD,
  productStatus,
  productStockLevel,
  setStock,
  setVariantStock,
  stockLevel,
  totalStock,
  type StockLevel,
} from '@/lib/services/catalogStore';

type QuickFilter = 'all' | 'low' | 'out';
const RESTOCK_STEP = 10;
const MAX_STOCK = 99_999;

/** One sellable unit: a product without variants, or a single variant. */
interface StockRow {
  key: string;
  product: ProductRecord;
  variant: ProductVariantRecord | null;
  sku: string;
  stock: number;
  level: StockLevel;
}

interface ProductGroup {
  product: ProductRecord;
  /** Rows to show for this product under the current filters. */
  rows: StockRow[];
}

function rowsOf(product: ProductRecord): StockRow[] {
  if (product.variants.length === 0) {
    return [{ key: product.id, product, variant: null, sku: product.sku, stock: product.stock, level: stockLevel(product.stock) }];
  }
  return product.variants.map((variant) => ({
    key: `${product.id}:${variant.id}`,
    product,
    variant,
    sku: variant.sku,
    stock: variant.stock,
    level: stockLevel(variant.stock),
  }));
}

const FILTER_LEVEL: Record<Exclude<QuickFilter, 'all'>, StockLevel> = { low: 'low_stock', out: 'out_of_stock' };

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function downloadCsv(groups: readonly ProductGroup[]) {
  const lines = [['Product', 'Product status', 'SKU', 'Variant', 'Stock', 'Stock status']];
  groups.forEach(({ rows }) =>
    rows.forEach((row) =>
      lines.push([
        row.product.name,
        productStatus(row.product),
        row.sku,
        row.variant ? row.variant.name : '',
        String(row.stock),
        STOCK_META[row.level].label,
      ]),
    ),
  );
  const csv = lines.map((line) => line.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `couture-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Tile({ label, value, tone = 'text-ink' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-sm border border-line bg-white px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">{label}</p>
      <p className={`mt-1 text-[22px] font-bold tabular-nums leading-tight ${tone}`}>{value.toLocaleString('en-US')}</p>
    </div>
  );
}

export function InventoryManager() {
  const { products, isHydrated } = useCatalog();
  const [filter, setFilter] = useState<QuickFilter>('all');
  const [search, setSearch] = useState('');
  /** Unsaved stock edits per row key. */
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  const allRows = useMemo(() => products.flatMap(rowsOf), [products]);

  const summary = useMemo(
    () => ({
      skus: allRows.length,
      units: allRows.reduce((sum, row) => sum + row.stock, 0),
      low: allRows.filter((row) => row.level === 'low_stock').length,
      out: allRows.filter((row) => row.level === 'out_of_stock').length,
    }),
    [allRows],
  );

  const groups = useMemo<ProductGroup[]>(() => {
    const term = search.trim().toLowerCase();
    return [...products]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((product) => {
        let rows = rowsOf(product);
        if (filter !== 'all') rows = rows.filter((row) => row.level === FILTER_LEVEL[filter]);
        if (term && !product.name.toLowerCase().includes(term) && !product.sku.toLowerCase().includes(term)) {
          rows = rows.filter((row) => row.sku.toLowerCase().includes(term) || !!row.variant?.name.toLowerCase().includes(term));
        }
        return { product, rows };
      })
      .filter((group) => group.rows.length > 0);
  }, [products, filter, search]);

  const visibleRowCount = groups.reduce((sum, group) => sum + group.rows.length, 0);

  const clearDraft = (key: string) =>
    setDrafts((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  const save = (row: StockRow, nextStock: number, message: string) => {
    const result = row.variant ? setVariantStock(row.product.id, row.variant.id, nextStock) : setStock(row.product.id, nextStock);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    clearDraft(row.key);
    toast.success(message, { id: `stock-${row.key}` });
  };

  const labelOf = (row: StockRow) => (row.variant ? `${row.product.name} (${row.variant.name})` : row.product.name);

  const filterTabs: { value: QuickFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: summary.skus },
    { value: 'low', label: 'Low stock', count: summary.low },
    { value: 'out', label: 'Out of stock', count: summary.out },
  ];

  const renderControls = (row: StockRow) => {
    const draft = drafts[row.key];
    const value = draft ?? row.stock;
    const dirty = draft !== undefined && draft !== row.stock;
    return (
      <div className="flex items-center justify-end gap-2">
        <QuantityStepper
          size="sm"
          min={0}
          max={MAX_STOCK}
          value={value}
          label={`Stock for ${labelOf(row)}`}
          onChange={(next) => setDrafts((current) => ({ ...current, [row.key]: next }))}
        />
        <Button size="sm" variant={dirty ? 'primary' : 'secondary'} disabled={!dirty} onClick={() => save(row, value, `Stock for ${labelOf(row)} set to ${value}`)}>
          Update
        </Button>
        <button
          type="button"
          className={ROW_ACTION}
          aria-label={`Restock ${labelOf(row)} by ${RESTOCK_STEP}`}
          onClick={() => save(row, row.stock + RESTOCK_STEP, `Added ${RESTOCK_STEP} units to ${labelOf(row)}`)}
        >
          Restock +{RESTOCK_STEP}
        </button>
      </div>
    );
  };

  return (
    <AdminPage
      title="Inventory"
      description={`Track and adjust stock for every product and variant. Low stock means ${LOW_STOCK_THRESHOLD} units or fewer.`}
      actions={
        <Button size="sm" variant="secondary" disabled={!isHydrated || visibleRowCount === 0} onClick={() => downloadCsv(groups)}>
          Export CSV
        </Button>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Total SKUs" value={isHydrated ? summary.skus : 0} />
        <Tile label="Units on hand" value={isHydrated ? summary.units : 0} />
        <Tile label="Low stock" value={isHydrated ? summary.low : 0} tone={summary.low > 0 && isHydrated ? 'text-discount' : 'text-ink'} />
        <Tile label="Out of stock" value={isHydrated ? summary.out : 0} tone={summary.out > 0 && isHydrated ? 'text-brand' : 'text-ink'} />
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Stock filter" className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={filter === tab.value}
                onClick={() => setFilter(tab.value)}
                className={`rounded-sm border px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide transition-colors ${FOCUS_RING} ${
                  filter === tab.value ? 'border-brand bg-brand-light text-brand' : 'border-line-strong bg-white text-ink-2 hover:border-ink'
                }`}
              >
                {tab.label}
                {isHydrated && <span className="ml-1.5 tabular-nums opacity-80">{tab.count}</span>}
              </button>
            ))}
          </div>
          <Input
            type="search"
            aria-label="Search inventory"
            placeholder="Search product name or SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leadingIcon={<SearchIcon />}
            wrapperClassName="w-full md:w-80"
          />
        </div>

        {!isHydrated ? (
          <TableSkeleton rows={8} />
        ) : groups.length === 0 ? (
          <EmptyState
            className="border-0"
            title={filter === 'out' ? 'Nothing is out of stock' : filter === 'low' ? 'Nothing is running low' : 'No inventory found'}
            description={search.trim() ? 'Try a different product name or SKU.' : 'Everything here is healthy.'}
            action={
              (filter !== 'all' || search.trim() !== '') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                >
                  Show all inventory
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className={ADMIN_TABLE.wrap}>
              <table className={`${ADMIN_TABLE.table} min-w-[920px]`}>
                <caption className="sr-only">Inventory by product and variant</caption>
                <thead>
                  <tr>
                    <th scope="col" className={ADMIN_TABLE.th}>Product</th>
                    <th scope="col" className={ADMIN_TABLE.th}>SKU</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Variant</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Status</th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(({ product, rows }) => {
                    const draft = productStatus(product) === 'draft';
                    const productCell = (
                      <div className="flex items-center gap-3">
                        <AdminThumb url={product.images[0]?.url} alt="" size={40} />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className={`block max-w-[260px] truncate rounded-sm font-bold text-ink hover:text-brand ${FOCUS_RING}`}
                          >
                            {product.name}
                          </Link>
                          <p className="text-[12px] text-ink-3">
                            {product.categoryName}
                            {draft ? ' · Draft' : ''}
                          </p>
                        </div>
                      </div>
                    );

                    if (product.variants.length === 0) {
                      const row = rows[0];
                      return (
                        <tr key={row.key} className={ADMIN_TABLE.row}>
                          <td className={ADMIN_TABLE.td}>{productCell}</td>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap font-mono text-[13px]`}>{row.sku}</td>
                          <td className={ADMIN_TABLE.td}>—</td>
                          <td className={ADMIN_TABLE.td}>
                            <StatusPill tone={STOCK_META[row.level].tone}>{STOCK_META[row.level].label}</StatusPill>
                          </td>
                          <td className={ADMIN_TABLE.td}>{renderControls(row)}</td>
                        </tr>
                      );
                    }

                    const level = STOCK_META[productStockLevel(product)];
                    return [
                      <tr key={product.id} className="bg-surface/40">
                        <td className={ADMIN_TABLE.td}>{productCell}</td>
                        <td className={`${ADMIN_TABLE.td} whitespace-nowrap font-mono text-[13px]`}>{product.sku}</td>
                        <td className={`${ADMIN_TABLE.td} text-[13px] text-ink-3`}>
                          {rows.length === product.variants.length
                            ? `${product.variants.length} variants`
                            : `${rows.length} of ${product.variants.length} variants shown`}
                        </td>
                        <td className={ADMIN_TABLE.td}>
                          <StatusPill tone={level.tone}>{level.label}</StatusPill>
                        </td>
                        <td className={`${ADMIN_TABLE.td} whitespace-nowrap text-right`}>
                          <span className="font-bold tabular-nums text-ink">{totalStock(product)}</span>
                          <span className="ml-1.5 text-[12px] text-ink-3">total (sum of active variants)</span>
                        </td>
                      </tr>,
                      ...rows.map((row) => (
                        <tr key={row.key} className={ADMIN_TABLE.row}>
                          <td className={`${ADMIN_TABLE.td} pl-10 sm:pl-[68px]`}>
                            <span className="flex items-center gap-2 text-[13px] text-ink-3">
                              <span aria-hidden="true" className="text-ink-4">└</span>
                              <span className="sr-only">{product.name} variant</span>
                              {row.variant?.name}
                            </span>
                          </td>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap font-mono text-[13px]`}>{row.sku}</td>
                          <td className={ADMIN_TABLE.td}>
                            <span className="text-ink">
                              {Object.values(row.variant?.attributes ?? {}).join(' / ') || row.variant?.name}
                            </span>
                            {row.variant && !row.variant.isActive && <span className="ml-2 text-[12px] text-ink-3">(inactive)</span>}
                          </td>
                          <td className={ADMIN_TABLE.td}>
                            <StatusPill tone={STOCK_META[row.level].tone}>{STOCK_META[row.level].label}</StatusPill>
                          </td>
                          <td className={ADMIN_TABLE.td}>{renderControls(row)}</td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-[13px] text-ink-3" aria-live="polite">
              Showing {visibleRowCount} of {summary.skus} SKUs across {groups.length} product{groups.length === 1 ? '' : 's'}
            </p>
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}

export default InventoryManager;
