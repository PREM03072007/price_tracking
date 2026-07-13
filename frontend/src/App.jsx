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

export default function App() {
  const [query, setQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Bank discount calculator state
  const [selectedOffer, setSelectedOffer] = useState('none');

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
            <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 4px 8px rgba(79, 70, 229, 0.2))' }}>
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="24" fill="url(#logo-grad)" />
              <circle cx="45" cy="45" r="18" stroke="white" strokeWidth="7" strokeLinecap="round" />
              <path d="M40 37H50M40 43H50M45 37C45 37 50 37 50 43C50 49 45 49 45 49H40M44 49L50 55" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M57 57L76 76" stroke="white" strokeWidth="8" strokeLinecap="round" />
              <path d="M78 28L80 33L85 35L80 37L78 42L76 37L71 35L76 33L78 28Z" fill="#a5b4fc" />
              <path d="M22 72L23 75L26 76L23 77L22 80L21 77L18 76L21 75L22 72Z" fill="#a5b4fc" />
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

          {/* Deal Analyzer Widget */}
          {(() => {
            if (!activeProduct || !activeProduct.links) return null;
            const items = activeProduct.links.filter(l => l.lastPrice !== null && l.lastPrice !== undefined);
            if (items.length <= 1) return null;

            let lowestItem = items[0];
            let highestItem = items[0];
            items.forEach(item => {
              if (item.lastPrice < lowestItem.lastPrice) lowestItem = item;
              if (item.lastPrice > highestItem.lastPrice) highestItem = item;
            });

            const savings = highestItem.lastPrice - lowestItem.lastPrice;
            if (savings <= 0) return null;

            const savingsPercent = (savings / highestItem.lastPrice) * 100;
            let dealScore = 5.0;
            let dealStrength = 'Standard';
            if (savingsPercent > 12) { dealScore = 9.8; dealStrength = 'Super Deal'; }
            else if (savingsPercent > 8) { dealScore = 9.3; dealStrength = 'Excellent Deal'; }
            else if (savingsPercent > 4) { dealScore = 8.6; dealStrength = 'Good Savings'; }
            else if (savingsPercent > 1.5) { dealScore = 7.4; dealStrength = 'Fair Deal'; }
            else { dealScore = 6.0; dealStrength = 'Slight Discount'; }

            return (
              <div className="card deal-analyzer-card" style={{ marginBottom: '28px' }}>
                <div className="deal-analyzer-layout">
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#4f46e5', marginBottom: '14px' }}>
                      <Sparkles size={20} />
                      Smart Deal Analyzer
                    </h3>
                    
                    <div className="deal-recommendation">
                      <span>💡</span>
                      <span>
                        We recommend buying from <strong>{lowestItem.platform}</strong>. You save <strong>₹{savings.toLocaleString('en-IN')}</strong> ({savingsPercent.toFixed(1)}%) compared to {highestItem.platform}!
                      </span>
                    </div>

                    <div className="deal-metrics-grid">
                      <div className="deal-metric-box">
                        <div className="deal-metric-label">Best Price</div>
                        <div className="deal-metric-val" style={{ color: '#059669' }}>₹{lowestItem.lastPrice.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="deal-metric-box">
                        <div className="deal-metric-label">Potential Savings</div>
                        <div className="deal-metric-val" style={{ color: '#4f46e5' }}>₹{savings.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="deal-metric-box">
                        <div className="deal-metric-label">Price Spread</div>
                        <div className="deal-metric-val">₹{highestItem.lastPrice.toLocaleString('en-IN')} max</div>
                      </div>
                    </div>

                    {/* Visual Price Axis Slider */}
                    {(() => {
                      const min = lowestItem.lastPrice;
                      const max = highestItem.lastPrice;
                      const range = max - min;
                      return (
                        <div className="price-axis-container">
                          <div className="price-axis-title">Platform Price Index</div>
                          <div className="price-axis-track">
                            {items.map((item, idx) => {
                              const pos = range > 0 ? ((item.lastPrice - min) / range) * 100 : 50;
                              const nodeClass = `price-axis-node ${item.platform.toLowerCase()}`;
                              return (
                                <div 
                                  key={item._id || idx} 
                                  className={nodeClass} 
                                  style={{ left: `${pos}%` }}
                                >
                                  <div className="price-axis-label">
                                    {item.platform}: ₹{item.lastPrice.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="price-axis-limits">
                            <span>Cheapest (₹{min.toLocaleString('en-IN')})</span>
                            <span>Max (₹{max.toLocaleString('en-IN')})</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="deal-score-section">
                    <div className="deal-score-circle">
                      <span className="deal-score-value">{dealScore.toFixed(1)}</span>
                      <span className="deal-score-label">Rating</span>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{dealStrength}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Based on platform variance</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Brand Directory & Store Highlights */}
          {(() => {
            if (!activeProduct || !activeProduct.links) return null;
            
            const brandMap = {};
            activeProduct.links.forEach(link => {
              if (link.lastPrice !== null && link.lastPrice !== undefined) {
                const brand = link.brand || 'Generic';
                if (!brandMap[brand]) brandMap[brand] = [];
                brandMap[brand].push(link);
              }
            });

            const uniqueBrands = Object.keys(brandMap);
            if (uniqueBrands.length === 0) return null;

            const getPopularStore = (brand) => {
              const fashionBrands = ['nike', 'adidas', 'puma', 'reebok', 'roadster', 'levis', 'levi\'s', 'highlander', 'zara', 'h&m', 'hrx', 'wrogn', 'peter', 'allen', 'van', 'polo', 'tape'];
              const brandLower = brand.toLowerCase();
              if (fashionBrands.some(fb => brandLower.includes(fb))) {
                return 'Flipkart';
              }
              return 'Amazon';
            };

            return (
              <div className="card brand-directory-card animate-card" style={{ marginBottom: '28px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: '#4f46e5', marginBottom: '4px' }}>
                  <Sparkles size={18} />
                  Brand Hub & Store Highlights
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Compare brand availability across platforms to find the cheapest and most popular stores.
                </p>

                <div className="brand-capsules-grid">
                  {uniqueBrands.map(brandName => {
                    const brandDeals = brandMap[brandName];
                    const sortedDeals = [...brandDeals].sort((a, b) => a.lastPrice - b.lastPrice);
                    const cheapestDeal = sortedDeals[0];
                    const popularStore = getPopularStore(brandName);

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

          <div className="comparison-grid">
            {(() => {
              const platforms = ['Amazon', 'Flipkart', 'Meesho'];
              return platforms.map(platform => {
                const platformLinks = activeProduct.links
                  .filter(l => l.platform === platform && l.lastPrice !== null)
                  .sort((a, b) => {
                    const priceA = getDiscountedPrice(a.lastPrice, a.platform)?.finalPrice || a.lastPrice;
                    const priceB = getDiscountedPrice(b.lastPrice, b.platform)?.finalPrice || b.lastPrice;
                    return priceA - priceB;
                  });

                if (platformLinks.length === 0) return null;

                const featured = platformLinks[0];
                const alternatives = platformLinks.slice(1);
                
                const featuredDisc = getDiscountedPrice(featured.lastPrice, platform);
                const hasFeaturedDiscount = featuredDisc && featuredDisc.discount > 0;
                const finalFeaturedPrice = hasFeaturedDiscount ? featuredDisc.finalPrice : featured.lastPrice;

                const isBestPrice = lowestPrice !== null && finalFeaturedPrice === lowestPrice;
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
                      </div>

                      {featured.brand && (
                        <div style={{ display: 'inline-block', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>
                          {featured.brand}
                        </div>
                      )}

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
                          Other Deals (Cheaper to Higher)
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
                                    {alt.brand || 'Generic'}
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
              });
            })()}
          </div>

          {/* Effective Price Calculator (Bank Offers) */}
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

          {/* Historical Trends Section */}
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
      )}
    </div>
  );
}
