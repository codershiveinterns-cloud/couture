const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

const slug = (s) => slugify(s, { lower: true, strict: true });

// Real product photography, pre-fetched from Wikimedia Commons (freely
// licensed, stable CDN) by scripts/fetch-product-images.js — see that
// script for how these were selected and vetted for relevance. Re-run it
// to refresh/expand this file.
const IMAGES = require('./product-images.json');

const CATEGORIES = [
  {
    name: 'Electronics',
    description: 'Phones, laptops, audio, and everyday tech.',
  },
  {
    name: 'Fashion',
    description: "Men's and women's apparel, footwear, and accessories.",
  },
  {
    name: 'Home & Kitchen',
    description: 'Furniture, cookware, and everyday home essentials.',
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Skincare, haircare, and grooming products.',
  },
  {
    name: 'Sports & Outdoors',
    description: 'Fitness gear, outdoor equipment, and activewear.',
  },
];

// productCount / images / variant flag configured per category. Each
// product's real photos are looked up from IMAGES.products by its slug.
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

const VARIANT_OPTIONS = {
  size: ['S', 'M', 'L', 'XL'],
  color: ['Black', 'White', 'Blue', 'Red'],
};

async function main() {
  console.log('Seeding database...');

  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();

  let categorySort = 0;
  let skuCounter = 1000;

  for (const cat of CATEGORIES) {
    const catSlug = slug(cat.name);
    const catImages = IMAGES.categories[catSlug] || [];
    if (catImages.length === 0) console.warn(`No fetched image for category "${cat.name}"`);

    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: catSlug,
        description: cat.description,
        imageUrl: catImages[0]?.url || null,
        sortOrder: categorySort++,
      },
    });

    const products = PRODUCTS_BY_CATEGORY[cat.name] || [];
    let featuredPicked = 0;

    for (const p of products) {
      skuCounter += 1;
      const productSlug = slug(p.name);
      const sku = `SKU-${skuCounter}`;
      const isFeatured = featuredPicked < 2;
      featuredPicked++;

      const productImages = IMAGES.products[productSlug] || [];
      if (productImages.length === 0) console.warn(`No fetched images for product "${p.name}"`);

      const product = await prisma.product.create({
        data: {
          name: p.name,
          slug: productSlug,
          sku,
          description: `${p.name} from ${p.brand}. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the ${cat.name} collection.`,
          shortDescription: `${p.brand} · ${cat.name}`,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          stock: 25 + Math.floor(Math.random() * 60),
          brand: p.brand,
          isFeatured,
          avgRating: (3.5 + Math.random() * 1.5).toFixed(1),
          reviewCount: Math.floor(Math.random() * 120),
          categoryId: category.id,
          images: {
            create: productImages.map((im, i) => ({
              url: im.url,
              altText: `${p.name} — image ${i + 1}`,
              sortOrder: i,
            })),
          },
        },
      });

      if (p.variants) {
        const options = VARIANT_OPTIONS[p.variants];
        await prisma.productVariant.createMany({
          data: options.map((opt, idx) => ({
            productId: product.id,
            sku: `${sku}-V${idx + 1}`,
            name: `${p.name} — ${opt}`,
            attributes: { [p.variants]: opt },
            priceDelta: 0,
            stock: 10 + idx * 5,
          })),
        });
      }
    }
  }

  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 30,
        maxDiscount: 25,
        usageLimit: 500,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      },
      {
        code: 'FLAT5',
        type: 'FIXED',
        value: 5,
        minOrderAmount: 20,
        usageLimit: 1000,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      },
    ],
  });

  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();
  console.log(`Seed complete: ${categoryCount} categories, ${productCount} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
