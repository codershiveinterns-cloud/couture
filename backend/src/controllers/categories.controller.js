const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeCategory } = require('../utils/serializers');

// GET /api/categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { isPublished: true } } } } },
  });

  res.json({ success: true, data: categories.map(serializeCategory) });
});

// GET /api/categories/:slug
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { products: { where: { isPublished: true } } } } },
  });

  if (!category || !category.isActive) {
    throw ApiError.notFound('Category not found');
  }

  res.json({ success: true, data: serializeCategory(category) });
});

module.exports = { listCategories, getCategoryBySlug };
