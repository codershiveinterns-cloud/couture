// Prisma returns Decimal fields as Decimal.js instances, which JSON.stringify
// renders as strings. Normalize them to numbers so the frontend gets plain
// numeric values.

const toNumber = (value) => (value === null || value === undefined ? value : Number(value));

const serializeCategory = (category) => {
  if (!category) return category;
  const { _count, ...rest } = category;
  return {
    ...rest,
    productCount: _count?.products ?? undefined,
  };
};

const serializeProductSummary = (product) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  price: toNumber(product.price),
  compareAtPrice: toNumber(product.compareAtPrice),
  stock: product.stock,
  avgRating: toNumber(product.avgRating),
  reviewCount: product.reviewCount,
  isFeatured: product.isFeatured,
  category: product.category
    ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
    : undefined,
  image: product.images?.[0]?.url ?? null,
  hoverImage: product.images?.[1]?.url ?? null,
});

const serializeProductDetail = (product) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  sku: product.sku,
  description: product.description,
  shortDescription: product.shortDescription,
  price: toNumber(product.price),
  compareAtPrice: toNumber(product.compareAtPrice),
  stock: product.stock,
  brand: product.brand,
  avgRating: toNumber(product.avgRating),
  reviewCount: product.reviewCount,
  isFeatured: product.isFeatured,
  category: product.category
    ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
    : undefined,
  images: (product.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    altText: img.altText,
    sortOrder: img.sortOrder,
  })),
  variants: (product.variants || []).map((v) => ({
    id: v.id,
    sku: v.sku,
    name: v.name,
    attributes: v.attributes,
    priceDelta: toNumber(v.priceDelta),
    stock: v.stock,
    isActive: v.isActive,
  })),
  createdAt: product.createdAt,
});

module.exports = { toNumber, serializeCategory, serializeProductSummary, serializeProductDetail };
