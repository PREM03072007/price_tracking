import Product from '../models/Product.js';
import PriceHistory from '../models/PriceHistory.js';
import { searchAndCompare } from '../services/scraper.js';

// Search and compare prices across platforms
export const searchAndCompareProduct = async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query parameter "q" is required' });
  }

  const cleanQuery = query.trim();

  try {
    // Check if query was searched before (case-insensitive)
    let product = await Product.findOne({ name: { $regex: new RegExp(`^${cleanQuery}$`, 'i') } });

    if (!product) {
      // First time search: Scrape live comparisons
      console.log(`First time search for query: "${cleanQuery}"`);
      const results = await searchAndCompare(cleanQuery);

      product = new Product({
        name: cleanQuery,
        links: results
      });

      await product.save();

      // Log initial history points
      const historyEntries = results.map(item => ({
        product: product._id,
        platform: item.platform,
        price: item.lastPrice,
        date: new Date()
      }));

      await PriceHistory.insertMany(historyEntries);
      return res.status(200).json(product);
    }

    // Cached search exists: Check if cache is fresh (e.g. less than 1 hour old)
    const firstLink = product.links[0];
    const cacheAgeMs = firstLink && firstLink.lastScraped 
      ? new Date() - new Date(firstLink.lastScraped) 
      : Infinity;

    const cacheExpiryTime = 60 * 60 * 1000; // 1 Hour

    if (cacheAgeMs < cacheExpiryTime) {
      console.log(`Returning cached prices for query: "${cleanQuery}" (Age: ${Math.round(cacheAgeMs/1000)}s)`);
      return res.status(200).json(product);
    }

    // Cache expired: Re-scrape and update database
    console.log(`Cache expired for query: "${cleanQuery}". Re-scraping...`);
    const results = await searchAndCompare(cleanQuery);

    product.links = results;
    product.markModified('links');
    await product.save();

    // Log history points
    const historyEntries = results.map(item => ({
      product: product._id,
      platform: item.platform,
      price: item.lastPrice,
      date: new Date()
    }));

    await PriceHistory.insertMany(historyEntries);
    return res.status(200).json(product);

  } catch (error) {
    console.error('Error during search and comparison:', error);
    res.status(500).json({ message: 'Error performing search and comparison', error: error.message });
  }
};

// Retrieve price history for chart rendering
export const getProductPriceHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const history = await PriceHistory.find({ product: id }).sort({ date: 1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving price history', error: error.message });
  }
};

// Retrieve list of recent searches for quick links
export const getRecentSearches = async (req, res) => {
  try {
    const recents = await Product.find()
      .select('name name createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json(recents);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving recent searches', error: error.message });
  }
};

// Delete a cached search
export const deleteSearchCache = async (req, res) => {
  const { id } = req.params;

  try {
    await Product.findByIdAndDelete(id);
    await PriceHistory.deleteMany({ product: id });
    res.status(200).json({ message: 'Search history and cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing search cache', error: error.message });
  }
};
