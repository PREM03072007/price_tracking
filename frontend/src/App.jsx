import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  ExternalLink, 
  BarChart2, 
  Clock, 
  ShoppingBag,
  Sparkles,
  RefreshCw,
  CreditCard,
  Wallet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const API_BASE = 'http://localhost:5001/api/products';

// Parses brand name from product title dynamically
const parseBrandFromTitle = (title) => {
  if (!title) return 'Generic';
  const brandList = [
    'Nike', 'Adidas', 'Puma', 'Reebok', 'Roadster', 'Levi\'s', 'Levis', 'Highlander', 
    'Sony', 'Apple', 'Samsung', 'Logitech', 'boAt', 'OnePlus', 'Dell', 'HP', 'Lenovo',
    'Asus', 'Acer', 'Philips', 'Casio', 'Titan', 'Fastrack', 'JBL', 'Sennheiser',
    'Zara', 'H&M', 'Allen Solly', 'Van Heusen', 'Peter England', 'Woodland', 'Bata',
    'Roadster', 'HRX', 'Wrogn', 'Peter England', 'Flying Machine', 'U.S. Polo Assn.',
    'US Polo', 'Red Tape', 'Allen Solly', 'Jack & Jones', 'Realme', 'Oppo', 'Vivo',
    'Motorola', 'Nothing', 'IQOO'
  ];
  
  const titleLower = title.toLowerCase();
  for (const brand of brandList) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  const firstWord = title.trim().split(/\s+/)[0];
  const cleanWord = firstWord.replace(/[^a-zA-Z]/g, '');
  if (cleanWord.length > 2) {
    return cleanWord;
  }
  return 'Generic';
};

// Category detection helper
const detectCategoryFromTitle = (title) => {
  const text = title.toLowerCase();
  if (/\b(laptop|notebook|macbook|chromebook|ultrabook|thinkpad|inspiron|pavilion|rog|zenbook|ideapad)\b/.test(text)) {
    return 'Laptops';
  }
  if (/\b(mobile|phone|smartphone|iphone|galaxy|pixel|oneplus|realme|redmi|poco|vivo|oppo|motorola)\b/.test(text)) {
    return 'Mobiles';
  }
  if (/\b(shirt|tshirt|t-shirt|jeans|top|dress|saree|kurtas|kurti|clothing|jacket|coat|suit|hoodie|sweatshirt)\b/.test(text)) {
    return 'Clothing';
  }
  if (/\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|slippers|footwear|loafers|crocs)\b/.test(text)) {
    return 'Shoes';
  }
  if (/\b(tv|television|smarttv|led\s*tv|oled\s*tv|qled\s*tv)\b/.test(text)) {
    return 'TV';
  }
  if (/\b(furniture|sofa|bed|chair|chairs|table|tables|desk|desks|wardrobe|cabinet|cupboard|couch)\b/.test(text)) {
    return 'Furniture';
  }
  if (/\b(headphone|headphones|earphone|earphones|earbud|earbuds|audio|soundbar|speaker|speakers|tws)\b/.test(text)) {
    return 'Audio';
  }
  return 'General';
};

// Build a clean, formatted variant label from extracted specs dynamically
const buildVariantLabel = (specs) => {
  const parts = [];
  if (specs.processor) parts.push(specs.processor);
  if (specs.ram) parts.push(specs.ram);
  if (specs.storage) parts.push(specs.storage);
  if (specs.screenSize) parts.push(specs.screenSize);
  if (specs.resolution) parts.push(specs.resolution);
  if (specs.material) parts.push(specs.material);
  if (specs.color) parts.push(specs.color);
  if (specs.size) parts.push(`Size ${specs.size}`);
  return parts.join(' / ') || 'Standard Spec';
};

// Dynamic specification extraction from listing title
const parseSpecs = (title, brand) => {
  const cleanBrand = (brand && brand !== 'Generic' ? brand : parseBrandFromTitle(title)).trim();
  const lowerTitle = title.toLowerCase();
  
  let titleWithoutBrand = title;
  if (cleanBrand.toLowerCase() !== 'generic') {
    titleWithoutBrand = title.replace(new RegExp(`^${cleanBrand}`, 'i'), '').trim();
  }
  
  // 1. Extract RAM (e.g. 4GB, 6GB, 8GB, 12GB, 16GB, 32GB)
  let ram = null;
  const ramMatch = lowerTitle.match(/(\d+)\s*gb\s*ram/i) || lowerTitle.match(/\b(4|6|8|12|16|24|32|64)\s*gb\b/i);
  if (ramMatch) {
    ram = `${ramMatch[1]}GB`;
  }
  
  // 2. Extract Storage / SSD (e.g. 64GB, 128GB, 256GB, 512GB, 1TB, 2TB)
  let storage = null;
  const storageMatch = lowerTitle.match(/(\d+)\s*(gb|tb)\s*(rom|ssd|storage|hdd)/i) || 
                       lowerTitle.match(/\b(64|128|256|512)\s*(gb)\b/i) ||
                       lowerTitle.match(/\b(1|2)\s*(tb)\b/i);
  if (storageMatch) {
    const val = storageMatch[1];
    const unit = (storageMatch[2] || 'GB').toUpperCase();
    storage = `${val}${unit}`;
    
    // If RAM and storage match the same pattern, make sure they don't overlap
    if (ram === storage) {
      ram = null;
    }
  }
  
  // 3. Extract Processor (e.g. i5, i7, i9, Ryzen 5, Ryzen 7, M1, M2, M3)
  let processor = null;
  const procMatch = lowerTitle.match(/\b(i3|i5|i7|i9|ryzen\s*\d+|m1|m2|m3|m4|snapdragon\s*\d+|bionic\s*\d+|dimensity\s*\d+)\b/i);
  if (procMatch) {
    processor = procMatch[1].toUpperCase();
  }
  
  // 4. Extract Screen Size (e.g. 14 inch, 15.6 inch, 55 inch)
  let screenSize = null;
  const screenMatch = lowerTitle.match(/(\d+(?:\.\d+)?)\s*(inch|\"|\-inch)/i);
  if (screenMatch) {
    screenSize = `${screenMatch[1]} inch`;
  }
  
  // 5. Extract Color
  let color = null;
  const colors = ['black', 'white', 'grey', 'gray', 'silver', 'gold', 'blue', 'green', 'red', 'yellow', 'pink', 'orange', 'purple', 'titanium', 'brown', 'beige'];
  for (const col of colors) {
    const regex = new RegExp(`\\b${col}\\b`, 'i');
    if (regex.test(lowerTitle)) {
      color = col.charAt(0).toUpperCase() + col.slice(1);
      break;
    }
  }

  // 6. Extract Clothing/Shoes Size
  let size = null;
  const sizeMatch = lowerTitle.match(/\b(uk|us|eu)\s*(\d+)\b/i) ||
                    lowerTitle.match(/size\s*(?::|is)?\s*([sml]||xl||xxl|xxxl|\d+)\b/i) ||
                    lowerTitle.match(/\b(s|m|l|xl|xxl|xxxl)\b/i);
  if (sizeMatch) {
    size = (sizeMatch[1] || sizeMatch[2]).toUpperCase();
  }

  // 7. Extract Material
  let material = null;
  const materials = ['cotton', 'polyester', 'denim', 'leather', 'wooden', 'wood', 'metal', 'plastic', 'glass', 'steel', 'fabric', 'wool', 'silk'];
  for (const mat of materials) {
    const regex = new RegExp(`\\b${mat}\\b`, 'i');
    if (regex.test(lowerTitle)) {
      material = mat.charAt(0).toUpperCase() + mat.slice(1);
      break;
    }
  }

  // 8. Extract Resolution
  let resolution = null;
  const resolutions = ['4k', 'uhd', 'fhd', 'hd ready', '1080p', '720p'];
  for (const res of resolutions) {
    if (lowerTitle.includes(res)) {
      resolution = res.toUpperCase();
      break;
    }
  }
  
  // 9. Extract Model Name (refined with color & filler stripping)
  let modelName = titleWithoutBrand
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\b\d+\s*gb\b/gi, '')
    .replace(/\b\d+\s*tb\b/gi, '')
    .replace(/\b(ram|rom|ssd|storage|hdd|windows\s*\d+|android\s*\d+|wifi|5g|4g|lte)\b/gi, '')
    .replace(/\b(i3|i5|i7|i9|ryzen\s*\d+|m1|m2|m3|m4|intel|amd|core|gen|generation|processor|graphics|nvidia|geforce|rtx|gtx)\b/gi, '')
    .replace(/\d+(?:\.\d+)?\s*(inch|\"|\-inch)/gi, '')
    .replace(/\b(black|white|grey|gray|silver|gold|blue|green|red|yellow|pink|orange|purple|titanium|brown|beige)\b/gi, '')
    .replace(/\b(laptop|notebook|ultrabook|pc|wireless|bluetooth|noise|cancelling|headphones|earphones|earbuds|headset|in\-ear|over\-ear|on\-ear|shoes|shoe|sneaker|sneakers|running|sports|casual|mens|men|womens|women|for|with|of|shirt|tshirt|t\-shirt|jeans|denim|pants|trousers|clothing|smartwatch|watch|watches|digital|analog|phone|mobile|smartphone|tv|television|led|oled|qled|furniture|sofa|bed|chair|table|desk)\b/gi, '')
    .replace(/[^a-zA-Z0-9\s\+\-\/\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  const modelWords = modelName.split(' ');
  if (modelWords.length > 4) {
    modelName = modelWords.slice(0, 4).join(' ');
  }
  
  return {
    brand: cleanBrand,
    model: modelName || 'Standard Model',
    ram,
    storage,
    processor,
    screenSize,
    color,
    size,
    material,
    resolution
  };
};

// Calculate match confidence score between two items
const calculateMatchingConfidence = (itemA, itemB) => {
  const specsA = parseSpecs(itemA.title, itemA.brand);
  const specsB = parseSpecs(itemB.title, itemB.brand);
  
  // Brand must match exactly
  if (specsA.brand.toLowerCase() !== specsB.brand.toLowerCase()) {
    return 0;
  }
  
  const modelA = specsA.model.toLowerCase();
  const modelB = specsB.model.toLowerCase();
  
  // Strict Sub-model / Series mismatch check
  const subModels = ['ultra', 'plus', 'pro', 'max', 'lite', 'fe', 'ce'];
  for (const sm of subModels) {
    const hasA = modelA.includes(sm);
    const hasB = modelB.includes(sm);
    if (hasA !== hasB) return 0;
  }
  
  // Calculate model similarity
  const tokensA = specsA.model.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const tokensB = specsB.model.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const intersection = tokensA.filter(t => tokensB.includes(t));
  const union = [...new Set([...tokensA, ...tokensB])];
  const modelSimilarity = union.length > 0 ? intersection.length / union.length : 1.0;
  
  if (modelSimilarity < 0.3) return 0;
  
  let score = 100 * modelSimilarity;
  
  // Specific specs checks (hard failure if mismatched)
  if (specsA.ram && specsB.ram) {
    if (specsA.ram !== specsB.ram) return 0;
  } else if (specsA.ram || specsB.ram) {
    score -= 12; // Missing spec penalty
  }
  
  if (specsA.storage && specsB.storage) {
    if (specsA.storage !== specsB.storage) return 0;
  } else if (specsA.storage || specsB.storage) {
    score -= 12; // Missing spec penalty
  }
  
  if (specsA.processor && specsB.processor) {
    if (specsA.processor !== specsB.processor) return 0;
  } else if (specsA.processor || specsB.processor) {
    score -= 8;
  }

  if (specsA.screenSize && specsB.screenSize) {
    if (specsA.screenSize !== specsB.screenSize) return 0;
  } else if (specsA.screenSize || specsB.screenSize) {
    score -= 8;
  }

  if (specsA.size && specsB.size) {
    if (specsA.size !== specsB.size) return 0;
  } else if (specsA.size || specsB.size) {
    score -= 12;
  }

  if (specsA.material && specsB.material) {
    if (specsA.material !== specsB.material) return 0;
  } else if (specsA.material || specsB.material) {
    score -= 8;
  }

  if (specsA.resolution && specsB.resolution) {
    if (specsA.resolution !== specsB.resolution) return 0;
  } else if (specsA.resolution || specsB.resolution) {
    score -= 8;
  }
  
  if (specsA.color && specsB.color) {
    if (specsA.color !== specsB.color) {
      score -= 10; // Color mismatch is soft penalty
    }
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export default function App() {
  const [query, setQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Bank discount calculator state
  const [selectedOffer, setSelectedOffer] = useState('none');

  // Category Search & Variant Matching States
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Calculates bank offers discount dynamically
  const getDiscountedPrice = (price, platform) => {
    if (price === null || price === undefined) return null;
    let discount = 0;
    let message = '';
    
    if (selectedOffer === 'sbi') {
      if (platform === 'Amazon') {
        discount = Math.min(price * 0.10, 1500); // 10% off up to 1500
        message = '10% SBI Card Instant Discount';
      } else if (platform === 'Flipkart') {
        discount = Math.min(price * 0.05, 1000); // 5% off up to 1000
        message = '5% SBI Card Discount';
      }
    } else if (selectedOffer === 'hdfc') {
      if (platform === 'Flipkart') {
        discount = Math.min(price * 0.10, 1500); // 10% off up to 1500
        message = '10% HDFC Card Instant Discount';
      } else if (platform === 'Amazon') {
        discount = Math.min(price * 0.05, 1000); // 5% off up to 1000
        message = '5% HDFC Card Discount';
      }
    } else if (selectedOffer === 'icici') {
      if (platform === 'Amazon') {
        discount = price * 0.05; // 5% unlimited for Amazon Pay ICICI
        message = '5% ICICI Amazon Pay Cashback';
      } else if (platform === 'Flipkart') {
        discount = Math.min(price * 0.05, 1000);
        message = '5% ICICI Card Discount';
      }
    } else if (selectedOffer === 'upi') {
      if (platform === 'Meesho') {
        discount = Math.min(price * 0.05, 50); // Meesho flat 5% off up to 50 on UPI
        message = 'Flat UPI Discount';
      } else if (platform === 'Flipkart') {
        discount = 30; // Flipkart flat 30 off on UPI
        message = 'Flat UPI Discount';
      } else if (platform === 'Amazon') {
        discount = 25; // Amazon flat 25 off on UPI
        message = 'Flat UPI Discount';
      }
    }
    
    const finalPrice = Math.max(0, price - Math.round(discount));
    return {
      finalPrice,
      discount: Math.round(discount),
      message
    };
  };

  // Fetch recent searches on mount
  useEffect(() => {
    fetchRecentSearches();
  }, []);

  const fetchRecentSearches = async () => {
    try {
      const res = await fetch(`${API_BASE}/recent`);
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data);
      }
    } catch (err) {
      console.error('Error fetching recent searches:', err);
    }
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') return;
    const term = searchQuery.trim();
    
    // Reset filters and variants
    setSelectedBrand('All');
    setSelectedModel(null);
    setSelectedVariant(null);
    
    try {
      setLoading(true);
      setActiveProduct(null);
      setPriceHistory([]);

      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const product = await res.json();
        setActiveProduct(product);
        fetchRecentSearches();
        fetchHistory(product._id);
      } else {
        alert('Failed to perform search. Please check backend connection.');
      }
    } catch (err) {
      console.error('Error in search:', err);
      alert('Error connecting to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (productId) => {
    try {
      setHistoryLoading(true);
      const res = await fetch(`${API_BASE}/${productId}/history`);
      if (res.ok) {
        const data = await res.json();
        
        // Group history points by date string for Recharts
        const grouped = {};
        data.forEach(item => {
          const dateStr = new Date(item.date).toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          if (!grouped[dateStr]) {
            grouped[dateStr] = { date: dateStr };
          }
          grouped[dateStr][item.platform] = item.price;
        });
        
        setPriceHistory(Object.values(grouped));
      }
    } catch (err) {
      console.error('Error fetching price history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getLowestPrice = () => {
    if (!activeProduct || !activeProduct.links) return null;
    const prices = activeProduct.links
      .map(l => {
        const disc = getDiscountedPrice(l.lastPrice, l.platform);
        return disc ? disc.finalPrice : l.lastPrice;
      })
      .filter(p => p !== null && p !== undefined);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  const lowestPrice = getLowestPrice();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 4px 12px rgba(6, 182, 212, 0.35))' }}>
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="26" fill="url(#logo-gradient)" />
              <path d="M30 48L34 76C34.3 78.2 36.2 79.8 38.5 79.8H61.5C63.8 79.8 65.7 78.2 66 76L70 48H30Z" fill="white" />
              <circle cx="50" cy="38" r="14" stroke="white" strokeWidth="6.5" fill="none" />
              <path d="M59.5 47.5L72 60" stroke="white" strokeWidth="7" strokeLinecap="round" />
              <path d="M46 54L56 62L48 62L54 70" stroke="url(#logo-gradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="logo-text">
            <h1>PriceSpy</h1>
            <p>Smart E-Commerce Price Comparison Engine</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
          <Clock size={16} />
          <span>Real-time Scrapers Active</span>
        </div>
      </header>

      {/* Main Search Page Area */}
      <div className="search-container">
        <h2>Compare Prices Instantly</h2>
        <p>Enter a product name to search and compare real-time prices across Amazon, Flipkart, and Meesho.</p>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="search-box-wrapper">
          <Search size={22} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search for mobiles, laptops, shoes, apparel..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            required
          />
          <button type="submit" className="btn btn-primary">
            Search & Compare
          </button>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="recent-searches-section">
            <h3>Recent Searches</h3>
            <div className="recent-list">
              {recentSearches.map((search) => (
                <div 
                  key={search._id} 
                  onClick={() => { setQuery(search.name); handleSearch(search.name); }} 
                  className="recent-item"
                >
                  <Search size={12} />
                  {search.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loader */}
      {loading && (
        <div className="loader-container card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="spinner"></div>
          <h3 style={{ marginBottom: '8px' }}>Scanning E-Commerce Platforms</h3>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            We are scraping Amazon, Flipkart, and Meesho dynamically. This might take 5-10 seconds...
          </p>
        </div>
      )}

      {/* Results Section */}
      {activeProduct && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '0.1em' }}>Comparison Results for</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginTop: '4px' }}>"{activeProduct.name}"</h2>
            </div>
            <button 
              onClick={() => handleSearch(activeProduct.name)} 
              className="btn btn-secondary" 
              style={{ padding: '10px 16px', borderRadius: '10px' }}
            >
              <RefreshCw size={16} />
              Re-scrape Live Prices
            </button>
          </div>

          {/* Brand & Model Discovery Section */}
          {(() => {
            // Extract unique brands dynamically
            const uniqueBrands = ['All', ...new Set(activeProduct.links.map(l => l.brand || parseBrandFromTitle(l.title)).filter(Boolean))];
            
            // Filter links by selected brand
            const brandFilteredLinks = selectedBrand === 'All' 
              ? activeProduct.links 
              : activeProduct.links.filter(l => (l.brand || parseBrandFromTitle(l.title)).toLowerCase() === selectedBrand.toLowerCase());

            // Group filtered links by model
            const modelGroups = {};
            brandFilteredLinks.forEach(link => {
              const specs = parseSpecs(link.title, link.brand);
              const model = specs.model;
              if (!modelGroups[model]) {
                modelGroups[model] = [];
              }
              modelGroups[model].push({
                ...link,
                specs
              });
            });

            const uniqueModels = Object.keys(modelGroups);

            // Auto reset model if it is not in the currently filtered list
            let activeModel = selectedModel;
            if (activeModel && !uniqueModels.includes(activeModel)) {
              activeModel = null;
            }

            // Extract variants for active model
            const modelItems = activeModel ? modelGroups[activeModel] : [];
            const variantMap = {};
            modelItems.forEach(item => {
              const label = buildVariantLabel(item.specs);
              if (!variantMap[label]) {
                variantMap[label] = [];
              }
              variantMap[label].push(item);
            });
            const uniqueVariants = Object.keys(variantMap);

            return (
              <div className="card brand-discovery-board" style={{ padding: '24px', marginBottom: '28px', border: '1.5px solid rgba(79, 70, 229, 0.1)', background: '#ffffff' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#4f46e5', marginBottom: '18px' }}>
                  <Search size={20} />
                  Product Finder & Variant Discovery
                </h3>
                
                {/* 1. Dynamic Brands Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    Filter by Brand
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {uniqueBrands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => {
                          setSelectedBrand(brand);
                          setSelectedModel(null);
                          setSelectedVariant(null);
                        }}
                        className={`btn ${selectedBrand === brand ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'capitalize' }}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Model Selection Board */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    Select Model
                  </label>
                  {uniqueModels.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No models found for this brand selection.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                      {uniqueModels.map(model => {
                        const count = modelGroups[model].length;
                        const isSelected = activeModel === model;
                        return (
                          <div
                            key={model}
                            onClick={() => {
                              setSelectedModel(model);
                              setSelectedVariant(null);
                            }}
                            style={{
                              padding: '12px 16px',
                              background: isSelected ? 'rgba(79, 70, 229, 0.05)' : '#f8fafc',
                              border: isSelected ? '2px solid #4f46e5' : '1px solid var(--border-color)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            className="model-select-card"
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#4f46e5' : 'var(--text-primary)' }}>
                              {model}
                            </span>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(15, 23, 42, 0.05)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                              {count} items
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Variant Selector */}
                {activeModel && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                      Select Exact Spec / Variant
                    </label>
                    {uniqueVariants.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No specific variants found.</div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {uniqueVariants.map(variant => {
                          const isSelected = selectedVariant === variant;
                          return (
                            <button
                              key={variant}
                              onClick={() => setSelectedVariant(variant)}
                              className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              {variant}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Variant Selector Guard */}
          {(() => {
            if (!selectedVariant) {
              return (
                <div className="card guide-placeholder-card" style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc', border: '2px dashed var(--border-color)', borderRadius: '16px', marginBottom: '28px' }}>
                  <ShoppingBag size={48} style={{ color: '#4f46e5', margin: '0 auto 16px auto', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>Select Brand, Model & Variant</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '8px auto 0 auto', lineHeight: '1.5' }}>
                    Please choose a brand, product model, and your preferred hardware specifications/color above to see live prices compared across platforms.
                  </p>
                </div>
              );
            }

            // Filter links by brand and isolate modelGroups again
            const brandFilteredLinks = selectedBrand === 'All' 
              ? activeProduct.links 
              : activeProduct.links.filter(l => (l.brand || parseBrandFromTitle(l.title)).toLowerCase() === selectedBrand.toLowerCase());

            const modelGroups = {};
            brandFilteredLinks.forEach(link => {
              const specs = parseSpecs(link.title, link.brand);
              const model = specs.model;
              if (!modelGroups[model]) {
                modelGroups[model] = [];
              }
              modelGroups[model].push({ ...link, specs });
            });

            const activeModelGroup = selectedModel ? (modelGroups[selectedModel] || []) : [];
            const matchedTemplates = activeModelGroup.filter(item => {
              const label = buildVariantLabel(item.specs);
              return label === selectedVariant;
            });
            
            const templateItem = matchedTemplates[0];
            if (!templateItem) return null;

            // Find exact matched items per platform (confidence >= 70% + matching brand)
            const platformMatches = {};
            const platforms = ['Amazon', 'Flipkart', 'Meesho'];
            platforms.forEach(platform => {
              const links = activeProduct.links
                .filter(l => l.platform === platform && l.lastPrice !== null)
                .filter(l => {
                  const lBrand = l.brand || parseBrandFromTitle(l.title);
                  return lBrand.toLowerCase() === templateItem.specs.brand.toLowerCase();
                })
                .map(l => ({
                  ...l,
                  confidence: calculateMatchingConfidence(templateItem, l)
                }))
                .filter(l => l.confidence >= 70)
                .sort((a, b) => {
                  const priceA = getDiscountedPrice(a.lastPrice, a.platform)?.finalPrice || a.lastPrice;
                  const priceB = getDiscountedPrice(b.lastPrice, b.platform)?.finalPrice || b.lastPrice;
                  return priceA - priceB;
                });
              platformMatches[platform] = links;
            });

            const availablePlatforms = platforms.filter(p => (platformMatches[p] || []).length > 0);
            const numAvailable = availablePlatforms.length;

            // Calculate lowest matched price
            const getLowestMatchedPrice = () => {
              const prices = [];
              platforms.forEach(platform => {
                const matches = platformMatches[platform] || [];
                if (matches.length > 0) {
                  const featured = matches[0];
                  const disc = getDiscountedPrice(featured.lastPrice, featured.platform);
                  prices.push(disc ? disc.finalPrice : featured.lastPrice);
                }
              });
              return prices.length > 0 ? Math.min(...prices) : null;
            };
            const lowestPrice = getLowestMatchedPrice();

            // Construct items for Deal Analyzer (only matched featured items)
            const matchedFeaturedItems = [];
            platforms.forEach(platform => {
              const matches = platformMatches[platform] || [];
              if (matches.length > 0) {
                matchedFeaturedItems.push(matches[0]);
              }
            });

            return (
              <div>
                {/* 1. Deal Analyzer Widget on matched items */}
                {(() => {
                  if (matchedFeaturedItems.length <= 1) return null;

                  let lowestItem = matchedFeaturedItems[0];
                  let highestItem = matchedFeaturedItems[0];
                  matchedFeaturedItems.forEach(item => {
                    const priceVal = getDiscountedPrice(item.lastPrice, item.platform)?.finalPrice || item.lastPrice;
                    const lowVal = getDiscountedPrice(lowestItem.lastPrice, lowestItem.platform)?.finalPrice || lowestItem.lastPrice;
                    const highVal = getDiscountedPrice(highestItem.lastPrice, highestItem.platform)?.finalPrice || highestItem.lastPrice;
                    
                    if (priceVal < lowVal) lowestItem = item;
                    if (priceVal > highVal) highestItem = item;
                  });

                  const lowPrice = getDiscountedPrice(lowestItem.lastPrice, lowestItem.platform)?.finalPrice || lowestItem.lastPrice;
                  const highPrice = getDiscountedPrice(highestItem.lastPrice, highestItem.platform)?.finalPrice || highestItem.lastPrice;
                  
                  const savings = highPrice - lowPrice;
                  if (savings <= 0) return null;

                  const savingsPercent = (savings / highPrice) * 100;
                  let dealScore = 5.0;
                  let dealStrength = 'Standard';
                  if (savingsPercent > 12) { dealScore = 9.8; dealStrength = 'Super Deal'; }
                  else if (savingsPercent > 5) { dealScore = 8.2; dealStrength = 'Good Deal'; }
                  else { dealScore = 6.5; dealStrength = 'Fair Deal'; }

                  return (
                    <div className="card deal-analyzer-card animate-card" style={{ marginBottom: '28px' }}>
                      <div className="deal-analyzer-grid">
                        <div>
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: '#4f46e5' }}>
                            <TrendingUp size={20} />
                            Smart Deal Analyzer (Matched Variant)
                          </h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                            We analyzed the matched listings. You save <strong style={{ color: '#059669' }}>₹{savings.toLocaleString('en-IN')}</strong> ({savingsPercent.toFixed(0)}%) by choosing the cheapest store!
                          </p>

                          <div className="price-axis-container">
                            <div className="price-axis-title">Platform Price Index</div>
                            <div className="price-axis-track">
                              {matchedFeaturedItems.map((item, idx) => {
                                const finalPrice = getDiscountedPrice(item.lastPrice, item.platform)?.finalPrice || item.lastPrice;
                                const pos = highPrice > lowPrice ? ((finalPrice - lowPrice) / (highPrice - lowPrice)) * 100 : 50;
                                const nodeClass = `price-axis-node ${item.platform.toLowerCase()}`;
                                return (
                                  <div 
                                    key={item._id || idx} 
                                    className={nodeClass} 
                                    style={{ left: `${pos}%` }}
                                  >
                                    <div className="price-axis-label">
                                      {item.platform}: ₹{finalPrice.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="price-axis-limits">
                              <span>Cheapest (₹{lowPrice.toLocaleString('en-IN')})</span>
                              <span>Max (₹{highPrice.toLocaleString('en-IN')})</span>
                            </div>
                          </div>
                        </div>

                        <div className="deal-score-section">
                          <div className="deal-score-circle">
                            <span className="deal-score-value">{dealScore.toFixed(1)}</span>
                            <span className="deal-score-label">Rating</span>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{dealStrength}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Based on variant variance</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Dynamic Brand Hub Summary */}
                {(() => {
                  const brandMap = {};
                  activeProduct.links.forEach(link => {
                    if (link.lastPrice !== null && link.lastPrice !== undefined) {
                      const brand = link.brand || parseBrandFromTitle(link.title);
                      if (!brandMap[brand]) brandMap[brand] = [];
                      brandMap[brand].push(link);
                    }
                  });

                  const uniqueBrands = Object.keys(brandMap);
                  if (uniqueBrands.length === 0) return null;

                  return (
                    <div className="card brand-directory-card animate-card" style={{ marginBottom: '28px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: '#4f46e5', marginBottom: '4px' }}>
                        <Sparkles size={18} />
                        Brand Hub & Store Highlights
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Compare overall brand availability across platforms to see store popularities.
                      </p>

                      <div className="brand-capsules-grid">
                        {uniqueBrands.map(brandName => {
                          const brandDeals = brandMap[brandName];
                          const sortedDeals = [...brandDeals].sort((a, b) => a.lastPrice - b.lastPrice);
                          const cheapestDeal = sortedDeals[0];
                          
                          const isFashion = ['nike', 'adidas', 'puma', 'reebok', 'roadster', 'levis', 'levi\'s', 'highlander', 'zara', 'h&m', 'hrx', 'wrogn'].some(b => brandName.toLowerCase().includes(b));
                          const popularStore = isFashion ? 'Flipkart' : 'Amazon';

                          return (
                            <div key={brandName} className="brand-capsule">
                              <div className="brand-capsule-header">
                                <span className="brand-name-tag">{brandName}</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', background: 'rgba(79, 70, 229, 0.06)', padding: '2px 8px', borderRadius: '12px' }}>
                                  {brandDeals.length} {brandDeals.length === 1 ? 'deal' : 'deals'}
                                </span>
                              </div>
                              
                              <div className="brand-meta-row" style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px', marginBottom: '6px' }}>
                                <span>Cheapest Store:</span>
                                <div>
                                  <span className="brand-highlight-store">{cheapestDeal.platform} </span>
                                  <span className="brand-highlight-price"> (₹{cheapestDeal.lastPrice.toLocaleString('en-IN')})</span>
                                </div>
                              </div>

                              <div className="brand-meta-row">
                                <span>Popular Store:</span>
                                <span className="brand-highlight-store" style={{ color: '#4f46e5' }}>{popularStore}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Main Comparison Cards Grid */}
                <div className="comparison-grid" style={{ marginBottom: '28px' }}>
                  {platforms.map(platform => {
                    const matches = platformMatches[platform] || [];
                    
                    if (matches.length === 0) {
                      const platformLower = platform.toLowerCase();
                      const logoColorClass = `platform-info ${platformLower}`;
                      return (
                        <div key={platform} className="card platform-card" style={{ opacity: 0.75, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 16px', background: '#f8fafc', border: '1px dashed var(--border-color)' }}>
                          <div className={logoColorClass} style={{ marginBottom: '16px' }}>
                            <ShoppingBag size={20} />
                            {platform}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                            Exact variant not found on {platform}.
                          </div>
                        </div>
                      );
                    }

                    const featured = matches[0];
                    const alternatives = matches.slice(1);
                    
                    const featuredDisc = getDiscountedPrice(featured.lastPrice, platform);
                    const hasFeaturedDiscount = featuredDisc && featuredDisc.discount > 0;
                    const finalFeaturedPrice = hasFeaturedDiscount ? featuredDisc.finalPrice : featured.lastPrice;

                    const isBestPrice = numAvailable >= 2 && lowestPrice !== null && finalFeaturedPrice === lowestPrice;
                    const platformLower = platform.toLowerCase();
                    const logoColorClass = `platform-info ${platformLower}`;
                    const btnClass = `store-btn ${platformLower}-btn`;

                    return (
                      <div key={platform} className={`card platform-card ${isBestPrice ? 'lowest-price' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div className={logoColorClass}>
                            <ShoppingBag size={20} />
                            {platform}
                            {isBestPrice && (
                              <span className="lowest-price-badge">Cheapest</span>
                            )}
                            {numAvailable === 1 && (
                              <span className="lowest-price-badge" style={{ backgroundColor: '#475569', color: '#ffffff' }}>
                                Only available on {platform}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            {featured.brand && (
                              <span style={{ display: 'inline-block', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                {featured.brand}
                              </span>
                            )}
                            
                            {/* Confidence Badges */}
                            {featured.confidence >= 90 ? (
                              <span style={{ display: 'inline-block', background: 'rgba(5, 150, 105, 0.08)', color: '#059669', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                ✨ Exact Match
                              </span>
                            ) : (
                              <span style={{ display: 'inline-block', background: 'rgba(217, 119, 6, 0.08)', color: '#d97706', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                👍 Likely Match ({featured.confidence}%)
                              </span>
                            )}
                          </div>

                          <div className="product-title" title={featured.title} style={{ minHeight: '44px' }}>
                            {featured.title || `${platform} listing for ${activeProduct.name}`}
                          </div>

                          <div className="product-image-container">
                            <img 
                              src={featured.image || 'https://placehold.co/600x400/f8fafc/4f46e5?text=Product+Image'} 
                              alt={featured.title} 
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/600x400/f8fafc/4f46e5?text=Product+Image';
                              }}
                            />
                          </div>
                          
                          <div className="price-section" style={{ margin: '12px 0 6px 0' }}>
                            <div className="price-label">Price</div>
                            <div className="price-val" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {hasFeaturedDiscount && (
                                <span className="discount-strike-price">
                                  ₹{featured.lastPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                              <span style={{ color: isBestPrice ? '#059669' : 'var(--text-primary)' }}>
                                ₹{finalFeaturedPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            {hasFeaturedDiscount && (
                              <span className="discount-applied-tag">
                                🎉 {featuredDisc.message} (Saved ₹{featuredDisc.discount.toLocaleString('en-IN')})
                              </span>
                            )}
                          </div>

                          <a 
                            href={featured.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            referrerPolicy="no-referrer"
                            className={btnClass}
                            style={{ margin: '8px 0 16px 0' }}
                          >
                            <span>Go to Store</span>
                            <ExternalLink size={16} />
                          </a>
                        </div>

                        {/* Alternatives List (Cheaper to Higher) */}
                        {alternatives.length > 0 && (
                          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.02em' }}>
                              Other Matched Deals
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {alternatives.map((alt, idx) => {
                                const altDisc = getDiscountedPrice(alt.lastPrice, platform);
                                const hasAltDiscount = altDisc && altDisc.discount > 0;
                                const finalAltPrice = hasAltDiscount ? altDisc.finalPrice : alt.lastPrice;

                                return (
                                  <a 
                                    key={alt._id || idx}
                                    href={alt.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    referrerPolicy="no-referrer"
                                    style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center', 
                                      padding: '8px 12px', 
                                      background: '#f8fafc', 
                                      borderRadius: '8px', 
                                      border: '1px solid var(--border-color)',
                                      textDecoration: 'none',
                                      color: 'inherit',
                                      transition: 'all 0.2s ease'
                                    }}
                                    className="alt-deal-row"
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>
                                        {alt.brand || 'Generic'} ({alt.confidence}%)
                                      </span>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {alt.title}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                      {hasAltDiscount && (
                                        <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 500, marginRight: '4px' }}>
                                          ₹{alt.lastPrice.toLocaleString('en-IN')}
                                        </span>
                                      )}
                                      ₹{finalAltPrice.toLocaleString('en-IN')}
                                      <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 4. Bank Discount Calculator */}
                <div className="card bank-offers-card animate-card" style={{ marginBottom: '28px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#4f46e5' }}>
                    <CreditCard size={20} />
                    Bank Offers & Net Price Calculator
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Select your payment card or wallet to dynamically apply instant bank discounts and cashbacks!
                  </p>

                  <div className="offers-selector-grid">
                    <button 
                      onClick={() => setSelectedOffer('none')}
                      className={`offer-selector-btn ${selectedOffer === 'none' ? 'active' : ''}`}
                    >
                      <Wallet size={16} />
                      <div>
                        <div style={{ fontSize: '0.85rem' }}>Standard Checkout</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>No card offers</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setSelectedOffer('sbi')}
                      className={`offer-selector-btn ${selectedOffer === 'sbi' ? 'active' : ''}`}
                    >
                      <CreditCard size={16} />
                      <div>
                        <div style={{ fontSize: '0.85rem' }}>SBI Credit Card</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>10% Off Amazon, 5% Flipkart</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setSelectedOffer('hdfc')}
                      className={`offer-selector-btn ${selectedOffer === 'hdfc' ? 'active' : ''}`}
                    >
                      <CreditCard size={16} />
                      <div>
                        <div style={{ fontSize: '0.85rem' }}>HDFC Credit Card</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>10% Off Flipkart, 5% Amazon</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setSelectedOffer('icici')}
                      className={`offer-selector-btn ${selectedOffer === 'icici' ? 'active' : ''}`}
                    >
                      <CreditCard size={16} />
                      <div>
                        <div style={{ fontSize: '0.85rem' }}>ICICI Credit Card</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>5% Cashback on Amazon Pay</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setSelectedOffer('upi')}
                      className={`offer-selector-btn ${selectedOffer === 'upi' ? 'active' : ''}`}
                    >
                      <Wallet size={16} />
                      <div>
                        <div style={{ fontSize: '0.85rem' }}>UPI / GPay / PhonePe</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>Flat ₹50 Meesho, ₹30 Flipkart</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 5. Historical Trends Section */}
                <div className="card chart-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <BarChart2 size={24} style={{ color: '#4f46e5' }} />
                    <div>
                      <h3 style={{ fontSize: '1.25rem' }}>Price History Tracker</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Track how the price of "{activeProduct.name}" has fluctuated across platforms</p>
                    </div>
                  </div>

                  {historyLoading ? (
                    <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : priceHistory.length === 0 ? (
                    <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <Sparkles size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p>Accumulating price history...</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Subsequent searches of this product will log data points here.</p>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceHistory} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                          <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                          <Tooltip 
                            contentStyle={{ background: 'white', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                            labelStyle={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="Amazon" stroke="#ff9900" strokeWidth={3} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Flipkart" stroke="#2874f0" strokeWidth={3} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Meesho" stroke="#f43f5e" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
