const { Router } = require('express');
const categoriesRoutes = require('./categories.routes');
const productsRoutes = require('./products.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);

module.exports = router;
