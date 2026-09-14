const { Router } = require('express');
const {
  listProducts,
  getProductBySlug,
  getRelatedProducts,
} = require('../controllers/products.controller');

const router = Router();

router.get('/', listProducts);
router.get('/:slug', getProductBySlug);
router.get('/:slug/related', getRelatedProducts);

module.exports = router;
