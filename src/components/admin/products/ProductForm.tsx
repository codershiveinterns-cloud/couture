'use client';

import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type FormEvent } from 'react';
import { AdminCard, StatusPill } from '@/components/admin/AdminPage';
import { Button, Checkbox, Input, Select, Textarea } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useCatalog } from '@/hooks/useCatalog';
import { formatPrice } from '@/lib/format';
import type { ProductRecord, ProductStatus } from '@/lib/mockTypes';
import {
  createProduct,
  EMPTY_PRODUCT_INPUT,
  IMAGE_URL_HINT,
  isAllowedImageUrl,
  productToInput,
  updateProduct,
  type ProductField,
  type ProductInput,
} from '@/lib/services/catalogStore';
import type { FieldErrors } from '@/lib/validation';
import { AdminThumb, discountPercent, FOCUS_RING, ROW_ACTION_DANGER } from './shared';

const MAX_IMAGES = 8;
const MAX_VARIANTS = 30;

interface ImageRow {
  key: string;
  url: string;
  altText: string;
}

interface VariantRow {
  key: string;
  id?: string;
  /** Stored display name + the option value it was written for (kept while the value is unchanged). */
  originalName?: string;
  originalValue?: string;
  /** Attributes other than the one edited here (only present on imported data). */
  extraAttributes: Record<string, string>;
  value: string;
  sku: string;
  stock: string;
  priceDelta: string;
  isActive: boolean;
}

interface FormState {
  name: string;
  brand: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
  status: ProductStatus;
  isFeatured: boolean;
  images: ImageRow[];
  attributeName: string;
  variants: VariantRow[];
  slug?: string;
}

const FIELD_LABELS: Record<ProductField, string> = {
  name: 'Name',
  sku: 'SKU',
  description: 'Description',
  shortDescription: 'Short description',
  price: 'Price',
  compareAtPrice: 'MRP',
  stock: 'Stock',
  brand: 'Brand',
  categoryId: 'Category',
  status: 'Status',
  images: 'Images',
  variants: 'Variations',
  slug: 'Slug',
};

// Row keys only need to be unique within the tab (rows exist client-side only).
let rowCounter = 0;
const nextKey = () => {
  rowCounter += 1;
  return `product-row-${rowCounter}`;
};

const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
const numberToText = (value: number) => (Number.isFinite(value) && value !== 0 ? String(value) : '');

function toFormState(input: ProductInput, isNew: boolean): FormState {
  const attributeKey = Object.keys(input.variants[0]?.attributes ?? {})[0] ?? 'color';
  return {
    name: input.name,
    brand: input.brand,
    categoryId: input.categoryId,
    shortDescription: input.shortDescription,
    description: input.description,
    price: numberToText(input.price),
    compareAtPrice: input.compareAtPrice === null ? '' : String(input.compareAtPrice),
    sku: input.sku,
    stock: isNew ? '' : String(input.stock),
    status: input.status,
    isFeatured: input.isFeatured,
    images: input.images.map((image) => ({ key: nextKey(), url: image.url, altText: image.altText ?? '' })),
    attributeName: capitalize(attributeKey),
    variants: input.variants.map((variant) => {
      const { [attributeKey]: value = '', ...extraAttributes } = variant.attributes;
      return {
        key: nextKey(),
        id: variant.id,
        originalName: variant.name,
        originalValue: value,
        extraAttributes,
        value,
        sku: variant.sku,
        stock: String(variant.stock),
        priceDelta: String(variant.priceDelta),
        isActive: variant.isActive,
      };
    }),
    slug: input.slug,
  };
}

const parseNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text));

function toProductInput(form: FormState): ProductInput {
  const attributeKey = form.attributeName.trim().toLowerCase();
  return {
    name: form.name,
    sku: form.sku,
    description: form.description,
    shortDescription: form.shortDescription,
    price: parseNumber(form.price),
    compareAtPrice: form.compareAtPrice.trim() === '' ? null : Number(form.compareAtPrice),
    stock: form.variants.length > 0 ? 0 : parseNumber(form.stock),
    brand: form.brand,
    isFeatured: form.isFeatured,
    categoryId: form.categoryId,
    status: form.status,
    images: form.images.filter((image) => image.url.trim()).map((image) => ({ url: image.url.trim(), altText: image.altText })),
    variants: form.variants.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.originalName && row.originalValue === row.value.trim() ? row.originalName : undefined,
      attributes: attributeKey ? { ...row.extraAttributes, [attributeKey]: row.value } : { ...row.extraAttributes },
      priceDelta: row.priceDelta.trim() === '' ? 0 : Number(row.priceDelta),
      stock: parseNumber(row.stock),
      isActive: row.isActive,
    })),
    slug: form.slug,
  };
}

/** Client-side duplicate check so the offending rows can be highlighted (the service reports one message). */
function duplicateSkuKeys(form: FormState): Set<string> {
  const counts = new Map<string, number>();
  const norm = (sku: string) => sku.trim().toUpperCase();
  [form.sku, ...form.variants.map((v) => v.sku)].forEach((sku) => {
    const key = norm(sku);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return new Set(form.variants.filter((v) => (counts.get(norm(v.sku)) ?? 0) > 1).map((v) => v.key));
}

const ICON_BUTTON = `inline-flex h-9 w-9 items-center justify-center rounded-sm border border-line-strong bg-white text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-4 ${FOCUS_RING}`;

function Arrow({ up }: { up: boolean }) {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductForm({ product }: { product?: ProductRecord }) {
  const router = useRouter();
  const { categories } = useCatalog();
  const formId = useId();
  const summaryRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>(() =>
    toFormState(product ? productToInput(product) : EMPTY_PRODUCT_INPUT, !product),
  );
  const [errors, setErrors] = useState<FieldErrors<ProductField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!product;
  const hasVariants = form.variants.length > 0;
  const duplicates = duplicateSkuKeys(form);

  const set = <K extends keyof FormState>(key: K, value: FormState[K], clear?: ProductField) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (clear && errors[clear]) setErrors((current) => ({ ...current, [clear]: undefined }));
  };

  // ---- pricing preview -------------------------------------------------------------------------
  const price = parseNumber(form.price);
  const mrp = form.compareAtPrice.trim() === '' ? null : Number(form.compareAtPrice);
  const off = discountPercent(price, mrp);
  const mrpLiveError =
    mrp !== null && Number.isFinite(price) && price > 0 && (!Number.isFinite(mrp) || mrp <= price)
      ? 'MRP must be greater than the selling price'
      : null;

  // ---- images ----------------------------------------------------------------------------------
  const updateImage = (key: string, patch: Partial<ImageRow>) =>
    set('images', form.images.map((image) => (image.key === key ? { ...image, ...patch } : image)), 'images');
  const moveImage = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= form.images.length) return;
    const next = [...form.images];
    [next[index], next[target]] = [next[target], next[index]];
    set('images', next, 'images');
  };

  // ---- variants --------------------------------------------------------------------------------
  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    set('variants', form.variants.map((row) => (row.key === key ? { ...row, ...patch } : row)), 'variants');
  const addVariant = () => {
    const base = form.sku.trim().toUpperCase();
    const taken = new Set(form.variants.map((v) => v.sku.trim().toUpperCase()));
    let n = form.variants.length + 1;
    while (base && taken.has(`${base}-V${n}`)) n += 1;
    set(
      'variants',
      [
        ...form.variants,
        { key: nextKey(), extraAttributes: {}, value: '', sku: base ? `${base}-V${n}` : '', stock: '0', priceDelta: '0', isActive: true },
      ],
      'variants',
    );
  };

  const variantStockTotal = form.variants.reduce((sum, row) => {
    const value = Number(row.stock);
    return row.isActive && Number.isFinite(value) ? sum + Math.max(0, Math.floor(value)) : sum;
  }, 0);

  // ---- submit ----------------------------------------------------------------------------------
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const input = toProductInput(form);
    const result = product ? updateProduct(product.id, input) : createProduct(input);
    if (!result.ok) {
      setSaving(false);
      setErrors((result.fieldErrors ?? {}) as FieldErrors<ProductField>);
      setFormError(result.error);
      toast.error(result.error);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    setFormError(null);
    if (product) {
      // Re-sync so freshly created variants pick up their permanent ids and normalised SKUs.
      setForm(toFormState(productToInput(result.data), false));
      setSaving(false);
      toast.success(result.data.status === 'published' ? 'Product saved and live' : 'Draft saved');
    } else {
      toast.success(result.data.status === 'published' ? 'Product created and published' : 'Product created as a draft');
      router.replace(`/admin/products/${result.data.id}`);
    }
  };

  const errorEntries = (Object.keys(errors) as ProductField[]).filter((field) => errors[field]);
  const id = (name: string) => `${formId}-${name}`;

  return (
    <form onSubmit={onSubmit} noValidate className="pb-4">
      {(formError || errorEntries.length > 0) && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mb-5 rounded-sm border border-brand/30 bg-brand-light px-4 py-3 text-[13px] text-ink outline-none"
        >
          <p className="font-bold text-brand">{formError ?? 'Please fix the highlighted fields'}</p>
          {errorEntries.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              {errorEntries.map((field) => (
                <li key={field}>
                  <span className="font-bold">{FIELD_LABELS[field]}:</span> {errors[field]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <AdminCard title="Basic info">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id={id('name')}
                label="Product name"
                required
                maxLength={120}
                value={form.name}
                onChange={(event) => set('name', event.target.value, 'name')}
                error={errors.name}
                wrapperClassName="sm:col-span-2"
              />
              <Input
                id={id('brand')}
                label="Brand"
                maxLength={60}
                value={form.brand}
                onChange={(event) => set('brand', event.target.value, 'brand')}
                error={errors.brand}
              />
              <Select
                id={id('category')}
                label="Category"
                required
                placeholder="Select a category"
                value={form.categoryId}
                onChange={(event) => set('categoryId', event.target.value, 'categoryId')}
                error={errors.categoryId}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
              />
              <Input
                id={id('short')}
                label="Short description"
                hint="One line shown on product cards."
                maxLength={200}
                value={form.shortDescription}
                onChange={(event) => set('shortDescription', event.target.value, 'shortDescription')}
                error={errors.shortDescription}
                wrapperClassName="sm:col-span-2"
              />
              <Textarea
                id={id('description')}
                label="Description"
                required
                rows={6}
                maxLength={4000}
                showCount
                value={form.description}
                onChange={(event) => set('description', event.target.value, 'description')}
                error={errors.description}
                wrapperClassName="sm:col-span-2"
              />
            </div>
          </AdminCard>

          <AdminCard
            title="Images"
            aside={
              <span className="text-[12px] text-ink-3">
                {form.images.length} / {MAX_IMAGES}
              </span>
            }
          >
            <p className="mb-4 text-[13px] text-ink-3">
              The first image is the primary one. Only <code className="text-ink-2">https://images.unsplash.com/…</code> URLs are served through
              the image optimiser, so other hosts are rejected on save.
            </p>
            {form.images.length === 0 ? (
              <p className="rounded-sm border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-3">
                No images yet. A product needs at least one image before it can be published.
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {form.images.map((image, index) => {
                  const url = image.url.trim();
                  const invalid = url !== '' && !isAllowedImageUrl(url);
                  return (
                    <li key={image.key} className="flex flex-col gap-3 rounded-sm border border-line p-3 sm:flex-row sm:items-start">
                      <div className="flex items-start gap-3">
                        <AdminThumb url={url} alt={image.altText || `Image ${index + 1} preview`} size={72} />
                        {index === 0 && (
                          <span className="sm:hidden">
                            <StatusPill tone="brand">Primary</StatusPill>
                          </span>
                        )}
                      </div>
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                        <Input
                          id={`${image.key}-url`}
                          type="url"
                          inputMode="url"
                          aria-label={`Image ${index + 1} URL`}
                          placeholder="https://images.unsplash.com/photo-…"
                          value={image.url}
                          onChange={(event) => updateImage(image.key, { url: event.target.value })}
                          error={invalid ? IMAGE_URL_HINT : null}
                          wrapperClassName="sm:col-span-2"
                        />
                        <Input
                          id={`${image.key}-alt`}
                          aria-label={`Image ${index + 1} alt text`}
                          placeholder="Alt text (defaults to the product name)"
                          value={image.altText}
                          onChange={(event) => updateImage(image.key, { altText: event.target.value })}
                          wrapperClassName="sm:col-span-2"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 sm:flex-col sm:items-end">
                        {index === 0 && (
                          <span className="hidden sm:block">
                            <StatusPill tone="brand">Primary</StatusPill>
                          </span>
                        )}
                        <div className="flex gap-1.5">
                          <button type="button" className={ICON_BUTTON} aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => moveImage(index, -1)}>
                            <Arrow up />
                          </button>
                          <button
                            type="button"
                            className={ICON_BUTTON}
                            aria-label={`Move image ${index + 1} down`}
                            disabled={index === form.images.length - 1}
                            onClick={() => moveImage(index, 1)}
                          >
                            <Arrow up={false} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className={ROW_ACTION_DANGER}
                          aria-label={`Remove image ${index + 1}`}
                          onClick={() => set('images', form.images.filter((row) => row.key !== image.key), 'images')}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {errors.images && (
              <p role="alert" className="mt-3 text-[12px] font-medium text-brand">
                {errors.images}
              </p>
            )}
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              disabled={form.images.length >= MAX_IMAGES}
              onClick={() => set('images', [...form.images, { key: nextKey(), url: '', altText: '' }], 'images')}
            >
              Add image
            </Button>
          </AdminCard>

          <AdminCard
            title="Variations"
            aside={hasVariants ? <span className="text-[12px] text-ink-3">{form.variants.length} / {MAX_VARIANTS}</span> : undefined}
          >
            <p className="mb-4 text-[13px] text-ink-3">
              Optional. Offer this product in several options (for example colours or sizes), each with its own SKU, stock and price difference.
            </p>
            {hasVariants && (
              <>
                <Input
                  id={id('attribute')}
                  label="Option name"
                  hint="For example Color or Size."
                  value={form.attributeName}
                  onChange={(event) => set('attributeName', event.target.value, 'variants')}
                  error={form.attributeName.trim() === '' ? 'Enter an option name' : null}
                  wrapperClassName="mb-4 max-w-xs"
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
                    <caption className="sr-only">Product variations</caption>
                    <thead>
                      <tr className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
                        <th scope="col" className="pb-2 pr-2">{form.attributeName.trim() || 'Value'}</th>
                        <th scope="col" className="pb-2 pr-2">SKU</th>
                        <th scope="col" className="w-24 pb-2 pr-2">Stock</th>
                        <th scope="col" className="w-28 pb-2 pr-2">Price +/−</th>
                        <th scope="col" className="w-20 pb-2 pr-2">Active</th>
                        <th scope="col" className="w-20 pb-2"><span className="sr-only">Remove</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.variants.map((row, index) => {
                        const delta = row.priceDelta.trim() === '' ? 0 : Number(row.priceDelta);
                        const rowPrice = Number.isFinite(price) && Number.isFinite(delta) ? price + delta : null;
                        return (
                          <tr key={row.key} className="align-top">
                            <td className="pb-3 pr-2">
                              <Input
                                id={`${row.key}-value`}
                                aria-label={`Variant ${index + 1} ${form.attributeName || 'value'}`}
                                placeholder="e.g. Black"
                                value={row.value}
                                onChange={(event) => updateVariant(row.key, { value: event.target.value })}
                              />
                            </td>
                            <td className="pb-3 pr-2">
                              <Input
                                id={`${row.key}-sku`}
                                aria-label={`Variant ${index + 1} SKU`}
                                value={row.sku}
                                onChange={(event) => updateVariant(row.key, { sku: event.target.value.toUpperCase() })}
                                error={duplicates.has(row.key) ? 'Duplicate SKU' : null}
                              />
                            </td>
                            <td className="pb-3 pr-2">
                              <Input
                                id={`${row.key}-stock`}
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                aria-label={`Variant ${index + 1} stock`}
                                value={row.stock}
                                onChange={(event) => updateVariant(row.key, { stock: event.target.value })}
                              />
                            </td>
                            <td className="pb-3 pr-2">
                              <Input
                                id={`${row.key}-delta`}
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                aria-label={`Variant ${index + 1} price difference`}
                                value={row.priceDelta}
                                onChange={(event) => updateVariant(row.key, { priceDelta: event.target.value })}
                                hint={rowPrice !== null && rowPrice > 0 ? `= ${formatPrice(rowPrice)}` : undefined}
                              />
                            </td>
                            <td className="pb-3 pr-2 pt-3">
                              <Checkbox
                                label={<span className="sr-only">Variant {index + 1} active</span>}
                                checked={row.isActive}
                                onChange={(event) => updateVariant(row.key, { isActive: event.target.checked })}
                              />
                            </td>
                            <td className="pb-3 pt-2 text-right">
                              <button
                                type="button"
                                className={ROW_ACTION_DANGER}
                                aria-label={`Remove variant ${index + 1}`}
                                onClick={() => set('variants', form.variants.filter((v) => v.key !== row.key), 'variants')}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {errors.variants && (
              <p role="alert" className="mb-3 text-[12px] font-medium text-brand">
                {errors.variants}
              </p>
            )}
            <Button size="sm" variant="secondary" disabled={form.variants.length >= MAX_VARIANTS} onClick={addVariant}>
              {hasVariants ? 'Add variant' : 'Add variations'}
            </Button>
          </AdminCard>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <AdminCard title="Status">
            <fieldset>
              <legend className="sr-only">Visibility</legend>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { value: 'published', label: 'Published', description: 'Visible and purchasable in the store.' },
                    { value: 'draft', label: 'Draft', description: 'Hidden from shoppers; removed from bags.' },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2.5 text-sm transition-colors ${
                      form.status === option.value ? 'border-brand bg-brand-light' : 'border-line-strong hover:border-ink-4'
                    }`}
                  >
                    <input
                      type="radio"
                      name={id('status')}
                      value={option.value}
                      checked={form.status === option.value}
                      onChange={() => set('status', option.value, 'status')}
                      className={`mt-0.5 h-4 w-4 accent-[#ff3f6c] ${FOCUS_RING}`}
                    />
                    <span className="flex flex-col leading-snug">
                      <span className="font-bold text-ink">{option.label}</span>
                      <span className="text-[12px] text-ink-3">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.status && (
                <p role="alert" className="mt-2 text-[12px] font-medium text-brand">
                  {errors.status}
                </p>
              )}
            </fieldset>
            <Checkbox
              wrapperClassName="mt-4"
              label="Featured product"
              description="Highlighted on the home page and featured lists."
              checked={form.isFeatured}
              onChange={(event) => set('isFeatured', event.target.checked)}
            />
          </AdminCard>

          <AdminCard title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Input
                id={id('price')}
                label="Selling price (USD)"
                required
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => set('price', event.target.value, 'price')}
                error={errors.price}
              />
              <Input
                id={id('mrp')}
                label="MRP / compare-at"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="Optional"
                value={form.compareAtPrice}
                onChange={(event) => set('compareAtPrice', event.target.value, 'compareAtPrice')}
                error={errors.compareAtPrice ?? mrpLiveError}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-baseline gap-2 rounded-sm bg-surface px-3 py-2.5 text-sm" aria-live="polite">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-3">Preview</span>
              {Number.isFinite(price) && price > 0 ? (
                <>
                  <span className="font-bold text-ink">{formatPrice(price)}</span>
                  {off !== null && mrp !== null && (
                    <>
                      <s className="text-ink-4">{formatPrice(mrp)}</s>
                      <span className="font-bold text-discount">({off}% OFF)</span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-ink-3">Enter a price</span>
              )}
            </div>
          </AdminCard>

          <AdminCard title="Inventory">
            <div className="grid gap-4">
              <Input
                id={id('sku')}
                label="SKU"
                required
                maxLength={40}
                hint="Letters, numbers, dots and dashes. Must be unique."
                value={form.sku}
                onChange={(event) => set('sku', event.target.value.toUpperCase(), 'sku')}
                error={errors.sku}
              />
              <Input
                id={id('stock')}
                label="Stock"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                disabled={hasVariants}
                value={hasVariants ? String(variantStockTotal) : form.stock}
                onChange={(event) => set('stock', event.target.value, 'stock')}
                error={hasVariants ? null : errors.stock}
                hint={hasVariants ? 'Calculated as the sum of active variant stock. Edit stock per variant.' : 'Units available to sell.'}
              />
            </div>
          </AdminCard>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-col-reverse gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-end sm:px-6 lg:-mx-8 lg:px-8">
        <p className="mr-auto hidden text-[13px] text-ink-3 sm:block">
          {isEdit ? 'Changes apply to the store as soon as you save.' : 'You can keep editing after the product is created.'}
        </p>
        <Button variant="secondary" href="/admin/products">
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {form.status === 'published' ? (isEdit ? 'Save & publish' : 'Create & publish') : isEdit ? 'Save draft' : 'Create draft'}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
