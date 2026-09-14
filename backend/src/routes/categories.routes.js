const { Router } = require('express');
const { listCategories, getCategoryBySlug } = require('../controllers/categories.controller');

const router = Router();

router.get('/', listCategories);
router.get('/:slug', getCategoryBySlug);

module.exports = router;
