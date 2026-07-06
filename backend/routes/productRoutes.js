import express from 'express';
import {
  searchAndCompareProduct,
  getProductPriceHistory,
  getRecentSearches,
  deleteSearchCache
} from '../controllers/productController.js';

const router = express.Router();

router.get('/search', searchAndCompareProduct);
router.get('/recent', getRecentSearches);
router.get('/:id/history', getProductPriceHistory);
router.delete('/:id', deleteSearchCache);

export default router;
