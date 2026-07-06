import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  ExternalLink, 
  BarChart2, 
  Clock, 
  ShoppingBag,
  Sparkles,
  RefreshCw
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

          <div className="comparison-grid">
            {activeProduct.links.map((link) => {
              const isBestPrice = lowestPrice !== null && link.lastPrice === lowestPrice;
              const platformLower = link.platform.toLowerCase();
              const logoColorClass = `platform-info ${platformLower}`;
              const btnClass = `store-btn ${platformLower}-btn`;

              return (
                <div key={link._id} className={`card platform-card ${isBestPrice ? 'lowest-price' : ''}`}>
                  <div>
                    <div className={logoColorClass}>
                      <ShoppingBag size={20} />
                      {link.platform}
                      {isBestPrice && (
                        <span className="lowest-price-badge">Cheapest</span>
                      )}
                    </div>

                    <div className="product-title" title={link.title}>
                      {link.title || `${link.platform} listing for ${activeProduct.name}`}
                    </div>

                    <div className="product-image-container">
                      <img 
                        src={link.image || 'https://placehold.co/600x400/f8fafc/4f46e5?text=Product+Image'} 
                        alt={link.title} 
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/f8fafc/4f46e5?text=Product+Image';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="price-section">
                      <div className="price-label">Price</div>
                      <div className="price-val">
                        {link.lastPrice !== null && link.lastPrice !== undefined 
                          ? `₹${link.lastPrice.toLocaleString('en-IN')}` 
                          : 'Unavailable'}
                      </div>
                    </div>

                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      referrerPolicy="no-referrer"
                      className={btnClass}
                    >
                      <span>Go to Store</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              );
            })}
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
