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
  Bell,
  X
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

  // Advanced features states
  const [alerts, setAlerts] = useState([]);
  const [targetPrice, setTargetPrice] = useState('');

  // Automatically initialize target price when active product loads
  useEffect(() => {
    if (activeProduct) {
      const lowest = getLowestPrice();
      if (lowest) {
        setTargetPrice(Math.round(lowest * 0.9));
      }
    }
  }, [activeProduct]);

  const handleCreateAlert = (e) => {
    if (e) e.preventDefault();
    if (!activeProduct || !targetPrice) return;
    const targetVal = parseFloat(targetPrice);
    if (isNaN(targetVal) || targetVal <= 0) {
      alert('Please enter a valid target price.');
      return;
    }

    const currentLowest = getLowestPrice();
    const existingIndex = alerts.findIndex(a => a.productName.toLowerCase() === activeProduct.name.toLowerCase());

    if (existingIndex > -1) {
      const updatedAlerts = [...alerts];
      updatedAlerts[existingIndex] = {
        ...updatedAlerts[existingIndex],
        targetPrice: targetVal,
        initialLowest: currentLowest
      };
      setAlerts(updatedAlerts);
    } else {
      const newAlert = {
        id: Date.now(),
        productName: activeProduct.name,
        targetPrice: targetVal,
        initialLowest: currentLowest
      };
      setAlerts([newAlert, ...alerts]);
    }
  };

  const handleRemoveAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
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
      .map(l => l.lastPrice)
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
            <TrendingUp size={24} />
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

          <div className="comparison-grid">
            {(() => {
              const platforms = ['Amazon', 'Flipkart', 'Meesho'];
              return platforms.map(platform => {
                const platformLinks = activeProduct.links
                  .filter(l => l.platform === platform && l.lastPrice !== null)
                  .sort((a, b) => a.lastPrice - b.lastPrice);

                if (platformLinks.length === 0) return null;

                const featured = platformLinks[0];
                const alternatives = platformLinks.slice(1);
                
                const isBestPrice = lowestPrice !== null && featured.lastPrice === lowestPrice;
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
                        <div className="price-val">
                          ₹{featured.lastPrice.toLocaleString('en-IN')}
                        </div>
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
                          {alternatives.map((alt, idx) => (
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
                                ₹{alt.lastPrice.toLocaleString('en-IN')}
                                <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Smart Price Drop Watchdog */}
          <div className="card price-alert-card animate-card" style={{ marginBottom: '28px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#4f46e5' }}>
              <Bell size={20} />
              Smart Price Drop Watchdog
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Set a target budget. We will monitor the price and highlight when it drops to or below your target!
            </p>

            {/* Advanced Price Target Selector Form */}
            {(() => {
              const lowest = getLowestPrice() || 0;
              const minSliderPrice = Math.round(lowest * 0.5);
              const maxSliderPrice = lowest;
              const targetVal = parseFloat(targetPrice) || lowest;
              const savingsAmount = lowest - targetVal;
              const savingsPercent = lowest > 0 ? (savingsAmount / lowest) * 100 : 0;

              return (
                <div style={{ margin: '20px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    
                    {/* Left: Slider & Preset Pills */}
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                        Set Target Budget
                      </label>
                      <input 
                        type="range" 
                        min={minSliderPrice} 
                        max={maxSliderPrice} 
                        step={lowest > 5000 ? 100 : 10}
                        value={targetPrice || lowest} 
                        onChange={(e) => setTargetPrice(parseInt(e.target.value))}
                        style={{ 
                          width: '100%', 
                          height: '6px', 
                          background: '#e2e8f0', 
                          borderRadius: '3px', 
                          outline: 'none', 
                          accentColor: '#4f46e5',
                          cursor: 'pointer',
                          margin: '16px 0 12px 0'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <span>50% Off (₹{minSliderPrice.toLocaleString('en-IN')})</span>
                        <span>Current (₹{lowest.toLocaleString('en-IN')})</span>
                      </div>

                      {/* Preset Pills */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button 
                          type="button" 
                          onClick={() => setTargetPrice(Math.round(lowest * 0.95))} 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px', minWidth: 'auto', flex: 1 }}
                        >
                          -5% Off
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setTargetPrice(Math.round(lowest * 0.90))} 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px', minWidth: 'auto', flex: 1 }}
                        >
                          -10% Off
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setTargetPrice(Math.round(lowest * 0.80))} 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px', minWidth: 'auto', flex: 1 }}
                        >
                          -20% Off
                        </button>
                      </div>
                    </div>

                    {/* Right: Live stats review panel */}
                    <div style={{ background: 'rgba(79, 70, 229, 0.03)', border: '1px solid rgba(79, 70, 229, 0.1)', padding: '16px', borderRadius: '14px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Price</span>
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginTop: '6px' }}>
                          <span style={{ position: 'absolute', left: '12px', fontWeight: 700, color: '#4f46e5' }}>₹</span>
                          <input 
                            type="number" 
                            value={targetPrice} 
                            onChange={(e) => setTargetPrice(e.target.value)} 
                            className="form-input" 
                            style={{ paddingLeft: '24px', width: '100%', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Required Drop:</span>
                          <span style={{ fontWeight: 700, color: savingsAmount > 0 ? '#ef4444' : '#059669' }}>
                            {savingsAmount > 0 ? `-₹${savingsAmount.toLocaleString('en-IN')}` : '₹0'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Target Savings:</span>
                          <span style={{ fontWeight: 700, color: '#4f46e5' }}>
                            {savingsPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            <button 
              onClick={() => handleCreateAlert()} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '12px' }}
            >
              <Bell size={18} />
              Activate Price Watchdog Monitor
            </button>

            {/* Render active alerts matching the query */}
            {(() => {
              const activeAlerts = alerts.filter(a => a.productName.toLowerCase() === activeProduct.name.toLowerCase());
              if (activeAlerts.length === 0) return null;

              return (
                <div className="price-alert-active-list">
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Monitors</h4>
                  {activeAlerts.map(alert => {
                    const lowest = getLowestPrice();
                    const isTargetMet = lowest !== null && lowest <= alert.targetPrice;
                    
                    // Progress percentage (target / lowest) capped at 100
                    const progress = lowest !== null ? Math.min((alert.targetPrice / lowest) * 100, 100) : 0;

                    return (
                      <div key={alert.id} className="price-alert-active-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                            <Bell size={16} />
                            Target Monitor Active
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {(() => {
                              const drop = lowest !== null ? lowest - alert.targetPrice : 0;
                              return (
                                <>
                                  Target Price: <strong>₹{alert.targetPrice.toLocaleString('en-IN')}</strong> | Required Drop:{' '}
                                  {drop > 0 ? (
                                    <strong style={{ color: '#ef4444' }}>₹{drop.toLocaleString('en-IN')}</strong>
                                  ) : (
                                    <strong style={{ color: '#059669' }}>₹0 (Target Met)</strong>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {isTargetMet ? (
                            <span className="badge badge-lowest" style={{ background: 'var(--success-gradient)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>🎯 Target Met!</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{progress.toFixed(0)}% Target</span>
                              <div className="price-alert-progress-bar">
                                <div className="price-alert-progress-fill" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>
                          )}
                          <button onClick={() => handleRemoveAlert(alert.id)} className="btn btn-secondary" style={{ color: '#ef4444', padding: '6px', minWidth: 'auto', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
