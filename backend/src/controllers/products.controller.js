const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeProductSummary, serializeProductDetail } = require('../utils/serializers');

const MAX_PAGE_SIZE = 48;
const DEFAULT_PAGE_SIZE = 12;

const SORT_MAP = {
  newest: [{ createdAt: 'desc' }],
  price_asc: [{ price: 'asc' }],
  price_desc: [{ price: 'desc' }],
  rating: [{ avgRating: 'desc' }],
  popularity: [{ reviewCount: 'desc' }],
};

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
};

// GET /api/products
const listProducts = asyncHandler(async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const { category, featured, q, sort } = req.query;

  const where = { isPublished: true };

  if (category) {
    where.category = { slug: category };
  }

  if (featured === 'true') {
    where.isFeatured = true;
  }

  if (q && q.trim()) {
    where.OR = [
      { name: { contains: q.trim(), mode: 'insensitive' } },
      { sku: { contains: q.trim(), mode: 'insensitive' } },
      { brand: { contains: q.trim(), mode: 'insensitive' } },
    ];
  }

  const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 2 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: items.map(serializeProductSummary),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
});

// GET /api/products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { where: { isActive: true } },
    },
  });

  if (!product || !product.isPublished) {
    throw ApiError.notFound('Product not found');
  }

  res.json({ success: true, data: serializeProductDetail(product) });
});

// GET /api/products/:slug/related
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const related = await prisma.product.findMany({
    where: {
      isPublished: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 2 },
    },
  });

  res.json({ success: true, data: related.map(serializeProductSummary) });
});

module.exports = { listProducts, getProductBySlug, getRelatedProducts };
