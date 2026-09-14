// One-off generator: builds a static mock catalog (categories + products)
// from the same source data used by the old Prisma seed script, baking in
// the curated real product photos. Run with `node scripts/gen-mock-data.js`
// and it writes src/lib/mockData.ts. Not used at runtime.

const fs = require('fs');
const path = require('path');
const slugify = require('../../backend/node_modules/slugify');

const slug = (s) => slugify(s, { lower: true, strict: true });

const IMAGES = require('../../backend/prisma/product-images.json');

const CATEGORIES = [
  { name: 'Electronics', description: 'Phones, laptops, audio, and everyday tech.' },
  { name: 'Fashion', description: "Men's and women's apparel, footwear, and accessories." },
  { name: 'Home & Kitchen', description: 'Furniture, cookware, and everyday home essentials.' },
  { name: 'Beauty & Personal Care', description: 'Skincare, haircare, and grooming products.' },
  { name: 'Sports & Outdoors', description: 'Fitness gear, outdoor equipment, and activewear.' },
];

const PRODUCTS_BY_CATEGORY = {
  Electronics: [
    { name: 'Aurora Wireless Headphones', price: 89.99, compareAtPrice: 109.99, brand: 'Aurora', variants: 'color' },
    { name: 'Pulse Smartwatch Series 4', price: 149.0, compareAtPrice: null, brand: 'Pulse', variants: 'color' },
    { name: 'NovaBook 14" Ultralight Laptop', price: 899.0, compareAtPrice: 999.0, brand: 'Nova', variants: null },
    { name: 'EchoDot Bluetooth Speaker', price: 39.5, compareAtPrice: null, brand: 'Echo', variants: 'color' },
    { name: 'FastCharge 65W USB-C Adapter', price: 24.99, compareAtPrice: 29.99, brand: 'FastCharge', variants: null },
    { name: 'ClearView 27" 4K Monitor', price: 329.0, compareAtPrice: null, brand: 'ClearView', variants: null },
  ],
  Fashion: [
    { name: 'Classic Cotton Crewneck Tee', price: 19.99, compareAtPrice: 24.99, brand: 'Urban Basics', variants: 'size' },
    { name: 'Slim Fit Denim Jacket', price: 64.0, compareAtPrice: null, brand: 'Urban Basics', variants: 'size' },
    { name: 'Everyday Running Sneakers', price: 74.5, compareAtPrice: 89.0, brand: 'Stride', variants: 'size' },
    { name: 'Leather Minimalist Wallet', price: 34.0, compareAtPrice: null, brand: 'Craft & Co.', variants: null },
    { name: 'Lightweight Rain Jacket', price: 58.0, compareAtPrice: 72.0, brand: 'Trailhead', variants: 'size' },
    { name: 'Wool Blend Scarf', price: 22.5, compareAtPrice: null, brand: 'Craft & Co.', variants: 'color' },
  ],
  'Home & Kitchen': [
    { name: 'Stainless Steel Cookware Set (10-Piece)', price: 129.0, compareAtPrice: 159.0, brand: 'HearthPro', variants: null },
    { name: 'Ceramic Non-Stick Frying Pan', price: 27.99, compareAtPrice: null, brand: 'HearthPro', variants: null },
    { name: 'Linen Throw Pillow Cover Set', price: 18.0, compareAtPrice: 22.0, brand: 'Nestwell', variants: 'color' },
    { name: 'Electric Pour-Over Kettle', price: 44.5, compareAtPrice: null, brand: 'Brewmate', variants: null },
    { name: 'Solid Oak Coffee Table', price: 219.0, compareAtPrice: 259.0, brand: 'Nestwell', variants: null },
    { name: '6-Piece Glass Storage Container Set', price: 32.99, compareAtPrice: null, brand: 'Nestwell', variants: null },
  ],
  'Beauty & Personal Care': [
    { name: 'Hydrating Vitamin C Serum', price: 26.0, compareAtPrice: 32.0, brand: 'Glowlab', variants: null },
    { name: 'Sulfate-Free Shampoo & Conditioner Set', price: 21.5, compareAtPrice: null, brand: 'PureRoot', variants: null },
    { name: 'Matte Finish Lipstick Trio', price: 18.99, compareAtPrice: 23.99, brand: 'Glowlab', variants: 'color' },
    { name: 'Rechargeable Electric Trimmer', price: 39.0, compareAtPrice: null, brand: 'Groomtech', variants: null },
  ],
  'Sports & Outdoors': [
    { name: 'Non-Slip Yoga Mat 6mm', price: 29.99, compareAtPrice: 36.99, brand: 'FlexFit', variants: 'color' },
    { name: 'Adjustable Dumbbell Set (5-25 lb)', price: 149.0, compareAtPrice: null, brand: 'IronCore', variants: null },
    { name: '2-Person Backpacking Tent', price: 119.0, compareAtPrice: 139.0, brand: 'Trailhead', variants: null },
    { name: 'Insulated Stainless Water Bottle 32oz', price: 24.0, compareAtPrice: null, brand: 'FlexFit', variants: 'color' },
  ],
};

const VARIANT_OPTIONS = { size: ['S', 'M', 'L', 'XL'], color: ['Black', 'White', 'Blue', 'Red'] };

let categorySort = 0;
let skuCounter = 1000;
let idCounter = 1;
const nextId = (prefix) => `${prefix}-${String(idCounter++).padStart(4, '0')}`;

const categories = [];
const products = [];

for (const cat of CATEGORIES) {
  const catSlug = slug(cat.name);
  const catImages = IMAGES.categories[catSlug] || [];
  const categoryId = nextId('cat');
  const items = PRODUCTS_BY_CATEGORY[cat.name] || [];

  categories.push({
    id: categoryId,
    name: cat.name,
    slug: catSlug,
    description: cat.description,
    imageUrl: catImages[0]?.url || null,
    sortOrder: categorySort++,
    productCount: items.length,
  });

  let featuredPicked = 0;

  for (const p of items) {
    skuCounter += 1;
    const productSlug = slug(p.name);
    const sku = `SKU-${skuCounter}`;
    const isFeatured = featuredPicked < 2;
    featuredPicked++;

    const productImages = (IMAGES.products[productSlug] || []).map((im) => im.url);
    const stock = 25 + Math.floor(Math.random() * 60);
    const avgRating = Number((3.5 + Math.random() * 1.5).toFixed(1));
    const reviewCount = Math.floor(Math.random() * 120);

    const variants = p.variants
      ? VARIANT_OPTIONS[p.variants].map((opt, idx) => ({
          id: nextId('var'),
          sku: `${sku}-V${idx + 1}`,
          name: `${p.name} — ${opt}`,
          attributes: { [p.variants]: opt },
          priceDelta: 0,
          stock: 10 + idx * 5,
          isActive: true,
        }))
      : [];

    products.push({
      id: nextId('prod'),
      name: p.name,
      slug: productSlug,
      sku,
      description: `${p.name} from ${p.brand}. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the ${cat.name} collection.`,
      shortDescription: `${p.brand} · ${cat.name}`,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock,
      brand: p.brand,
      isFeatured,
      avgRating,
      reviewCount,
      categoryId,
      categorySlug: catSlug,
      categoryName: cat.name,
      images: productImages.map((url, i) => ({
        id: nextId('img'),
        url,
        altText: `${p.name} — image ${i + 1}`,
        sortOrder: i,
      })),
      variants,
      createdAt: new Date(Date.now() - (products.length + 1) * 3600_000).toISOString(),
    });
  }
}

const out = `// AUTO-GENERATED by scripts/gen-mock-data.js — do not hand-edit.
// Static catalog data for the frontend-only demo build (no database).
// Regenerate with: node scripts/gen-mock-data.js

import type { CategoryRecord, ProductRecord } from './mockTypes';

export const MOCK_CATEGORIES: CategoryRecord[] = ${JSON.stringify(categories, null, 2)};

export const MOCK_PRODUCTS: ProductRecord[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'lib', 'mockData.ts'), out);
console.log(`Wrote mockData.ts: ${categories.length} categories, ${products.length} products.`);
