'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/format';

function BagIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <path d="M6 8h12l1 12H5L6 8z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.3C19.5 15.9 12 20.5 12 20.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinejoin="round" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17" cy="17.5" r="1.5" />
    </svg>
  );
}

function ShareIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" strokeLinecap="round" />
    </svg>
  );
}

function RulerIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <rect x="3" y="8" width="18" height="8" rx="1" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" strokeLinecap="round" />
    </svg>
  );
}

/** Share (Web Share API or clipboard fallback) + Size guide. UI only in Milestone 1. */
function ShareRow() {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const showCopied = () => {
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = document.title;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the sheet or sharing failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showCopied();
    } catch {
      // Clipboard unavailable (insecure context / permissions) — nothing to show.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-bold text-ink">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-sm outline-none transition-colors duration-150 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </button>
      <button
        type="button"
        title="Size guide arrives with Milestone 2"
        className="inline-flex items-center gap-1.5 rounded-sm outline-none transition-colors duration-150 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <RulerIcon className="h-4 w-4" />
        Size guide
      </button>
      <span role="status" aria-live="polite" className="text-[12px] font-bold text-success">
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  );
}

/** Pincode check is UI only in Milestone 1: it validates the format and shows an inline confirmation. */
function DeliveryCheck() {
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<string | null>(null);

  const handleCheck = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = pincode.trim();
    if (!/^[A-Za-z0-9 -]{4,10}$/.test(value)) {
      setError('Enter a valid pincode');
      setChecked(null);
      return;
    }
    setError(null);
    setChecked(value.toUpperCase());
  };

  return (
    <div>
      <h3 className="flex items-center gap-2 text-[16px] font-bold uppercase tracking-wide text-ink">
        Delivery options
        <TruckIcon className="h-5 w-5 text-ink-2" />
      </h3>
      <form onSubmit={handleCheck} noValidate className="mt-3 flex max-w-[320px] items-center rounded-sm border border-line-strong bg-white focus-within:border-ink">
        <label htmlFor="pincode" className="sr-only">
          Pincode
        </label>
        <input
          id="pincode"
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value);
            if (error) setError(null);
          }}
          inputMode="text"
          autoComplete="postal-code"
          placeholder="Enter pincode"
          aria-invalid={error ? true : undefined}
          aria-describedby="pincode-status"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none"
        />
        <button type="submit" className="h-11 px-4 text-sm font-bold uppercase text-brand hover:underline">
          Check
        </button>
      </form>
      <p id="pincode-status" role="status" className={`mt-1.5 text-[12px] ${error ? 'text-brand' : checked ? 'font-bold text-success' : 'text-ink-3'}`}>
        {error
          ? error
          : checked
            ? `Delivery available to ${checked} in 3–5 business days. Free shipping over $50.`
            : 'Please enter PIN code to check delivery time & Pay on Delivery availability'}
      </p>
      <ul className="mt-4 space-y-1.5 text-[14px] text-ink-2">
        <li>100% Original Products</li>
        <li>Pay on delivery might be available</li>
        <li>Easy 14 days returns and exchanges</li>
      </ul>
    </div>
  );
}

function VariantChip({
  attributeKey,
  value,
  selected,
  disabled,
  onSelect,
}: {
  attributeKey: string;
  value: string;
  selected: boolean;
  disabled: boolean;
  onSelect(): void;
}) {
  const isColor = attributeKey.toLowerCase() === 'color' || attributeKey.toLowerCase() === 'colour';
  const isShort = value.length <= 4;

  if (isColor) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${value}${disabled ? ' (out of stock)' : ''}`}
        title={value}
        className="group flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
      >
        <span
          className={`relative flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 bg-white transition-colors duration-150 ${
            selected ? 'border-brand' : 'border-line-strong group-hover:border-ink'
          } ${disabled ? 'opacity-40' : ''}`}
        >
          <span className="h-9 w-9 rounded-full border border-line" style={{ backgroundColor: value.toLowerCase() }} />
          {disabled && <span className="absolute h-px w-[60px] rotate-45 bg-ink-3" aria-hidden="true" />}
        </span>
        <span className={`text-[12px] ${selected ? 'font-bold text-brand' : 'text-ink-2'}`}>{value}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${attributeKey} ${value}${disabled ? ' (out of stock)' : ''}`}
      className={`relative flex h-[50px] items-center justify-center overflow-hidden border text-[14px] font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
        isShort ? 'w-[50px] rounded-full' : 'rounded-full px-5'
      } ${selected ? 'border-brand text-brand' : 'border-line-strong text-ink hover:border-brand'}`}
    >
      {value}
      {disabled && <span className="absolute h-px w-[140%] rotate-45 bg-ink-3" aria-hidden="true" />}
    </button>
  );
}

export default function ProductActions({
  basePrice,
  compareAtPrice = null,
  stock,
  variants,
}: {
  basePrice: number;
  compareAtPrice?: number | null;
  stock: number;
  variants: ProductVariant[];
}) {
  const attributeKey = variants[0] ? Object.keys(variants[0].attributes)[0] : null;
  const [selectedValue, setSelectedValue] = useState<string | null>(
    attributeKey ? variants[0].attributes[attributeKey] : null,
  );
  const [quantity, setQuantity] = useState(1);
  // Milestone 1 previews the interactions; cart, checkout and wishlist persistence ship in Milestone 2.
  const [justAdded, setJustAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const selectedVariant = useMemo(
    () => (attributeKey ? variants.find((v) => v.attributes[attributeKey] === selectedValue) : null),
    [attributeKey, variants, selectedValue],
  );

  const effectiveStock = selectedVariant ? selectedVariant.stock : stock;
  const effectivePrice = basePrice + (selectedVariant?.priceDelta || 0);
  const outOfStock = effectiveStock <= 0;

  // Keep the MRP gap constant when a variant adds a price delta.
  const effectiveMrp =
    compareAtPrice !== null && compareAtPrice > basePrice ? compareAtPrice + (selectedVariant?.priceDelta || 0) : null;
  const discountPct = effectiveMrp ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0;

  // Clamp for display/controls so a quantity chosen for a higher-stock
  // variant never exceeds the stock of whichever variant is now selected.
  const displayQuantity = Math.min(quantity, Math.max(effectiveStock, 1));

  const selectVariant = (value: string) => {
    setSelectedValue(value);
    setQuantity(1);
  };

  const handleAddToBag = () => {
    setJustAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Price row */}
      <div>
        <div key={effectivePrice} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 animate-fade-in">
          <span className="text-[24px] font-bold leading-none text-ink">{formatPrice(effectivePrice)}</span>
          {effectiveMrp && (
            <>
              <span className="text-[20px] text-ink-3">
                MRP <s>{formatPrice(effectiveMrp)}</s>
              </span>
              {discountPct > 0 && <span className="text-[20px] font-bold text-discount">({discountPct}% OFF)</span>}
            </>
          )}
        </div>
        <p className="mt-1.5 text-[14px] font-bold text-success">inclusive of all taxes</p>
      </div>

      {/* Variant selection */}
      {attributeKey && (
        <div>
          <h3 className="mb-3 text-[16px] font-bold uppercase tracking-wide text-ink">Select {attributeKey}</h3>
          <div role="group" aria-label={`Select ${attributeKey}`} className="flex flex-wrap gap-3">
            {variants.map((v) => {
              const value = v.attributes[attributeKey];
              return (
                <VariantChip
                  key={v.id}
                  attributeKey={attributeKey}
                  value={value}
                  selected={value === selectedValue}
                  disabled={v.stock <= 0}
                  onSelect={() => selectVariant(value)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="mb-3 text-[16px] font-bold uppercase tracking-wide text-ink">Quantity</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-11 items-center rounded-sm border border-line-strong">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={displayQuantity <= 1}
              className="flex h-full w-11 items-center justify-center text-lg text-ink-2 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:text-ink-4"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-11 border-x border-line-strong text-center text-sm font-bold leading-[42px] tabular-nums text-ink">
              {displayQuantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(effectiveStock || 1, q + 1))}
              disabled={displayQuantity >= effectiveStock}
              className="flex h-full w-11 items-center justify-center text-lg text-ink-2 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:text-ink-4"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className={`text-[13px] font-bold ${outOfStock ? 'text-brand' : 'text-ink-3'}`} aria-live="polite">
            {outOfStock ? 'OUT OF STOCK' : effectiveStock <= 5 ? `Only ${effectiveStock} left!` : `${effectiveStock} in stock`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={outOfStock}
            title="Cart & checkout ship in Milestone 2"
            onClick={handleAddToBag}
            className={`flex h-[54px] flex-1 items-center justify-center gap-2.5 rounded-sm text-[14px] font-bold uppercase tracking-wide text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-ink-4 ${
              justAdded ? 'bg-success' : 'bg-brand hover:bg-brand-dark'
            }`}
          >
            <BagIcon className="h-5 w-5" />
            {justAdded ? 'Added to bag' : 'Add to bag'}
          </button>
          <button
            type="button"
            onClick={() => setWishlisted((w) => !w)}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            title="Wishlist syncing arrives in Milestone 2"
            className={`flex h-[54px] flex-1 items-center justify-center gap-2.5 rounded-sm border text-[14px] font-bold uppercase tracking-wide transition-colors duration-150 ${
              wishlisted ? 'border-brand bg-brand-light text-brand' : 'border-line-strong bg-white text-ink hover:border-ink'
            }`}
          >
            <HeartIcon className="h-5 w-5" filled={wishlisted} />
            <span className="hidden sm:inline">{wishlisted ? 'Wishlisted' : 'Wishlist'}</span>
          </button>
        </div>
        <button
          type="button"
          disabled={outOfStock}
          title="Cart & checkout ship in Milestone 2"
          onClick={handleAddToBag}
          className="flex h-[48px] w-full items-center justify-center rounded-sm border border-line-strong bg-white text-[14px] font-bold uppercase tracking-wide text-ink transition-colors duration-150 hover:border-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-4"
        >
          Buy now
        </button>
        <p className="text-[12px] text-ink-3">
          Cart, checkout and wishlist persistence are part of Milestone 2 — this page previews the interactions.
        </p>
        <ShareRow />
      </div>

      <div className="border-t border-line pt-6">
        <DeliveryCheck />
      </div>
    </div>
  );
}
