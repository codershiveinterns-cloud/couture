/** Whole-number "% OFF" for a selling price against its MRP (0 when there is no discount). */
export function discountPercent(price: number, compareAtPrice: number | null | undefined): number {
  if (!compareAtPrice || compareAtPrice <= 0 || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export interface MrpLine {
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
}

/** Sum of MRP × qty across lines (falls back to the selling price when a line has no MRP). */
export function computeMrpTotal(lines: readonly MrpLine[]): number {
  const total = lines.reduce((sum, line) => sum + Math.max(line.compareAtPrice ?? 0, line.unitPrice) * line.quantity, 0);
  return Math.round(total * 100) / 100;
}
