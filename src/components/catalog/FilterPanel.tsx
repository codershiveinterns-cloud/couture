'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import type { CategorySummary, FacetOption, ProductFacets } from '@/lib/types';
import { RATING_OPTIONS, slugifyId, toggleValue, type FilterValues } from './catalogParams';

export interface FilterPanelProps {
  facets: ProductFacets;
  /** Omit to hide the category facet (category pages are already scoped). */
  categories?: CategorySummary[];
  values: FilterValues;
  onChange(next: FilterValues): void;
  /** Keeps input ids unique when the panel is mounted twice (sidebar + drawer). */
  idPrefix?: string;
  className?: string;
}

const SWATCHES: Record<string, string> = {
  black: '#0c0a09',
  white: '#ffffff',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#facc15',
  grey: '#9ca3af',
  gray: '#9ca3af',
  pink: '#ec4899',
  purple: '#7c3aed',
  orange: '#f97316',
  brown: '#92400e',
  beige: '#e7dcc8',
  navy: '#1e3a8a',
};

/** How many options a long list shows before the "+ N more" link. */
const COLLAPSED_LIMIT = 6;

function swatchColor(name: string): string {
  return SWATCHES[name.toLowerCase()] ?? name.toLowerCase();
}

const CONTROL_BASE =
  'h-4 w-4 shrink-0 cursor-pointer appearance-none border border-line-strong bg-white transition-colors duration-150 hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

const CHECKBOX_CLASS = `${CONTROL_BASE} rounded-[2px] checked:border-brand checked:bg-brand checked:bg-[url("data:image/svg+xml,%3csvg%20xmlns%3d%27http%3a//www.w3.org/2000/svg%27%20viewBox%3d%270%200%2016%2016%27%20fill%3d%27none%27%20stroke%3d%27white%27%20stroke-width%3d%272.4%27%20stroke-linecap%3d%27round%27%20stroke-linejoin%3d%27round%27%3e%3cpath%20d%3d%27M3.5%208.5l3%203%206-7%27/%3e%3c/svg%3e")] checked:bg-center checked:bg-no-repeat`;

const RADIO_CLASS = `${CONTROL_BASE} rounded-full checked:border-[5px] checked:border-brand`;

export default function FilterPanel({ facets, categories, values, onChange, idPrefix = 'filter', className = '' }: FilterPanelProps) {
  const id = (name: string) => `${idPrefix}-${slugifyId(name)}`;

  return (
    <div className={`flex flex-col divide-y divide-line ${className}`}>
      {categories && categories.length > 0 && (
        <Section title="Categories">
          <fieldset className="flex flex-col">
            <legend className="sr-only">Category</legend>
            <RadioRow
              id={id('category-all')}
              name={`${idPrefix}-category`}
              checked={!values.category}
              onChange={() => onChange({ ...values, category: undefined })}
              label="All categories"
            />
            {categories.map((cat) => (
              <RadioRow
                key={cat.id}
                id={id(`category-${cat.slug}`)}
                name={`${idPrefix}-category`}
                checked={values.category === cat.slug}
                onChange={() => onChange({ ...values, category: cat.slug })}
                label={cat.name}
                count={cat.productCount}
              />
            ))}
          </fieldset>
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title="Brand">
          <fieldset className="flex flex-col">
            <legend className="sr-only">Brand</legend>
            <CollapsibleList
              items={facets.brands}
              label="brands"
              render={(brand) => (
                <CheckRow
                  key={brand.value}
                  id={id(`brand-${brand.value}`)}
                  checked={values.brands.includes(brand.value)}
                  onChange={() => onChange({ ...values, brands: toggleValue(values.brands, brand.value) })}
                  label={brand.value}
                  count={brand.count}
                />
              )}
            />
          </fieldset>
        </Section>
      )}

      <Section title="Price">
        <PriceFields
          key={`${values.minPrice ?? ''}-${values.maxPrice ?? ''}`}
          idPrefix={idPrefix}
          min={values.minPrice}
          max={values.maxPrice}
          facetMin={facets.priceMin}
          facetMax={facets.priceMax}
          onApply={(minPrice, maxPrice) => onChange({ ...values, minPrice, maxPrice })}
        />
      </Section>

      {facets.colors.length > 0 && (
        <Section title="Color">
          <fieldset className="flex flex-col">
            <legend className="sr-only">Color</legend>
            <CollapsibleList
              items={facets.colors}
              label="colors"
              render={(color) => (
                <CheckRow
                  key={color.value}
                  id={id(`color-${color.value}`)}
                  checked={values.colors.includes(color.value)}
                  onChange={() => onChange({ ...values, colors: toggleValue(values.colors, color.value) })}
                  label={color.value}
                  count={color.count}
                  swatch={swatchColor(color.value)}
                />
              )}
            />
          </fieldset>
        </Section>
      )}

      {facets.sizes.length > 0 && (
        <Section title="Size">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
            {facets.sizes.map((size) => {
              const pressed = values.sizes.includes(size.value);
              return (
                <button
                  key={size.value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onChange({ ...values, sizes: toggleValue(values.sizes, size.value) })}
                  className={`flex h-9 min-w-10 items-center justify-center rounded-sm border px-2.5 text-[13px] font-bold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    pressed ? 'border-brand bg-brand-light text-brand' : 'border-line-strong bg-white text-ink hover:border-ink'
                  }`}
                >
                  {size.value}
                  <span className="sr-only"> ({size.count})</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Customer Rating">
        <fieldset className="flex flex-col">
          <legend className="sr-only">Minimum rating</legend>
          <RadioRow
            id={id('rating-any')}
            name={`${idPrefix}-rating`}
            checked={values.minRating === undefined}
            onChange={() => onChange({ ...values, minRating: undefined })}
            label="Any rating"
          />
          {RATING_OPTIONS.map((stars) => (
            <RadioRow
              key={stars}
              id={id(`rating-${stars}`)}
              name={`${idPrefix}-rating`}
              checked={values.minRating === stars}
              onChange={() => onChange({ ...values, minRating: stars })}
              label={
                <span className="flex items-center gap-1">
                  <span>{stars}</span>
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-rating">
                    <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 6 21l1.3-6.8-5-4.7 6.8-.8L12 2.5z" />
                  </svg>
                  <span>&amp; above</span>
                  <span className="sr-only">{`${stars} stars and above`}</span>
                </span>
              }
            />
          ))}
        </fieldset>
      </Section>

      <Section title="Availability">
        <CheckRow
          id={id('in-stock')}
          checked={values.inStock}
          onChange={() => onChange({ ...values, inStock: !values.inStock })}
          label="In stock only"
          count={facets.inStockCount}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <h3 className="mb-2.5 text-[14px] font-bold uppercase tracking-wide text-ink">{title}</h3>
      {children}
    </section>
  );
}

/** Shows the first few options with a brand-coloured "+ N more" toggle, like Myntra's brand facet. */
function CollapsibleList({
  items,
  label,
  render,
}: {
  items: FacetOption[];
  label: string;
  render(item: FacetOption): ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const hidden = items.length - COLLAPSED_LIMIT;
  const visible = expanded || hidden <= 0 ? items : items.slice(0, COLLAPSED_LIMIT);

  return (
    <>
      {visible.map(render)}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 self-start rounded-sm text-[14px] font-bold text-brand transition-colors hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {expanded ? 'Show less' : `+ ${hidden} more`}
          <span className="sr-only"> {label}</span>
        </button>
      )}
    </>
  );
}

function RadioRow({
  id,
  name,
  checked,
  onChange,
  label,
  count,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange(): void;
  label: ReactNode;
  count?: number;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[14px] text-ink hover:text-ink">
      <input id={id} type="radio" name={name} checked={checked} onChange={onChange} className={RADIO_CLASS} />
      <span className={`flex-1 truncate ${checked ? 'font-bold' : ''}`}>{label}</span>
      {typeof count === 'number' && <span className="text-[12px] text-ink-4">({count})</span>}
    </label>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  label,
  count,
  swatch,
}: {
  id: string;
  checked: boolean;
  onChange(): void;
  label: string;
  count: number;
  swatch?: string;
}) {
  const lightSwatch = swatch === '#ffffff';
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[14px] text-ink">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className={CHECKBOX_CLASS} />
      {swatch && (
        <span
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 rounded-full ${lightSwatch ? 'border border-line-strong' : ''}`}
          style={{ backgroundColor: swatch }}
        />
      )}
      <span className={`flex-1 truncate capitalize ${checked ? 'font-bold' : ''}`}>{label}</span>
      <span className="text-[12px] text-ink-4">({count})</span>
    </label>
  );
}

function PriceFields({
  idPrefix,
  min,
  max,
  facetMin,
  facetMax,
  onApply,
}: {
  idPrefix: string;
  min?: number;
  max?: number;
  facetMin: number;
  facetMax: number;
  onApply(min: number | undefined, max: number | undefined): void;
}) {
  const [minDraft, setMinDraft] = useState(min === undefined ? '' : String(min));
  const [maxDraft, setMaxDraft] = useState(max === undefined ? '' : String(max));
  const [error, setError] = useState<string | null>(null);
  const minId = `${idPrefix}-price-min`;
  const maxId = `${idPrefix}-price-max`;
  const errorId = `${idPrefix}-price-error`;

  const parse = (raw: string): number | undefined | null => {
    if (raw.trim() === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nextMin = parse(minDraft);
    const nextMax = parse(maxDraft);
    if (nextMin === null || nextMax === null) {
      setError('Enter valid, non-negative amounts.');
      return;
    }
    if (nextMin !== undefined && nextMax !== undefined && nextMin > nextMax) {
      setError('Min price must be less than or equal to max price.');
      return;
    }
    setError(null);
    onApply(nextMin, nextMax);
  };

  const inputClass =
    'h-9 w-full rounded-sm border border-line-strong bg-white py-1 pl-6 pr-2 text-[14px] text-ink placeholder:text-ink-4 outline-none transition-colors focus:border-ink';

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <label htmlFor={minId} className="sr-only">
            Minimum price
          </label>
          <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-ink-4">
            $
          </span>
          <input
            id={minId}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder={String(facetMin)}
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>
        <span className="text-ink-4">–</span>
        <div className="relative flex-1">
          <label htmlFor={maxId} className="sr-only">
            Maximum price
          </label>
          <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-ink-4">
            $
          </span>
          <input
            id={maxId}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder={String(facetMax)}
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="h-9 shrink-0 rounded-sm border border-line-strong bg-white px-3 text-[12px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Go
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-[12px] text-brand">
          {error}
        </p>
      )}
    </form>
  );
}
