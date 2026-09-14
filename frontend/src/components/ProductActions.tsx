'use client';

import { useMemo, useState } from 'react';
import type { ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/format';

export default function ProductActions({
  basePrice,
  stock,
  variants,
}: {
  basePrice: number;
  stock: number;
  variants: ProductVariant[];
}) {
  const attributeKey = variants[0] ? Object.keys(variants[0].attributes)[0] : null;
  const [selectedValue, setSelectedValue] = useState<string | null>(
    attributeKey ? variants[0].attributes[attributeKey] : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = useMemo(
    () => (attributeKey ? variants.find((v) => v.attributes[attributeKey] === selectedValue) : null),
    [attributeKey, variants, selectedValue],
  );

  const effectiveStock = selectedVariant ? selectedVariant.stock : stock;
  const effectivePrice = basePrice + (selectedVariant?.priceDelta || 0);
  const outOfStock = effectiveStock <= 0;

  // Clamp for display/controls so a quantity chosen for a higher-stock
  // variant never exceeds the stock of whichever variant is now selected.
  const displayQuantity = Math.min(quantity, Math.max(effectiveStock, 1));

  const selectVariant = (value: string) => {
    setSelectedValue(value);
    setQuantity(1);
  };

  return (
    <div className="flex flex-col gap-5">
      <div key={effectivePrice} className="animate-fade-in text-2xl font-semibold text-slate-900">
        {formatPrice(effectivePrice)}
      </div>

      {attributeKey && (
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            {attributeKey[0].toUpperCase() + attributeKey.slice(1)}
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const value = v.attributes[attributeKey];
              const isSelected = value === selectedValue;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock <= 0}
                  onClick={() => selectVariant(value)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? 'border-brand bg-brand text-white shadow-sm'
                      : 'border-slate-300 text-slate-700 hover:border-brand/50 hover:text-brand'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">Quantity</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-slate-300">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={displayQuantity <= 1}
              className="flex h-9 w-9 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-medium tabular-nums">{displayQuantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(effectiveStock || 1, q + 1))}
              disabled={displayQuantity >= effectiveStock}
              className="flex h-9 w-9 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className={`text-sm transition-colors ${outOfStock ? 'text-rose-600' : 'text-slate-500'}`}>
            {outOfStock ? 'Out of stock' : `${effectiveStock} in stock`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={outOfStock}
          title="Cart & checkout ship in Milestone 2"
          onClick={() => {
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 1200);
          }}
          className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-300 ${
            justAdded ? 'bg-emerald-600' : 'bg-brand hover:bg-brand-dark'
          }`}
        >
          {justAdded ? 'Added ✓' : 'Add to Cart'}
        </button>
        <button
          type="button"
          disabled={outOfStock}
          title="Cart & checkout ship in Milestone 2"
          className="flex-1 rounded-full border border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-150 hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-300"
        >
          Buy Now
        </button>
        <button
          type="button"
          onClick={() => setWishlisted((w) => !w)}
          title="Wishlist syncing arrives in Milestone 2"
          aria-pressed={wishlisted}
          aria-label="Toggle wishlist"
          className={`flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border transition-all duration-150 active:scale-90 sm:self-auto ${
            wishlisted ? 'border-rose-500 text-rose-500' : 'border-slate-300 text-slate-500 hover:border-rose-300 hover:text-rose-400'
          }`}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Cart, checkout, and wishlist persistence are part of Milestone 2 — this page previews the
        full product experience.
      </p>
    </div>
  );
}
