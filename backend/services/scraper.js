import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'
];

const getRandomHeaders = () => ({
  'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Upgrade-Insecure-Requests': '1'
});

const cleanPrice = (priceText) => {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

// URL formatter helpers to ensure clean, valid HTTPS URLs
const formatAmazonUrl = (href, query) => {
  if (!href) return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `https://www.amazon.in${href}`;
  if (href.startsWith('http://')) return href.replace('http://', 'https://');
  if (href.startsWith('https://')) return href;
  return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
};

const formatFlipkartUrl = (href, query) => {
  if (!href) return `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `https://www.flipkart.com${href}`;
  if (href.startsWith('http://')) return href.replace('http://', 'https://');
  if (href.startsWith('https://')) return href;
  return `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
};

const formatMeeshoUrl = (href, query) => {
  if (!href) return `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `https://www.meesho.com${href}`;
  if (href.startsWith('http://')) return href.replace('http://', 'https://');
  if (href.startsWith('https://')) return href;
  return `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
};

// Parses brand name from product title dynamically
const parseBrandFromTitle = (title) => {
  if (!title) return 'Generic';
  const brandList = [
    'Nike', 'Adidas', 'Puma', 'Reebok', 'Roadster', 'Levi\'s', 'Levis', 'Highlander', 
    'Sony', 'Apple', 'Samsung', 'Logitech', 'boAt', 'OnePlus', 'Dell', 'HP', 'Lenovo',
    'Asus', 'Acer', 'Philips', 'Casio', 'Titan', 'Fastrack', 'JBL', 'Sennheiser',
    'Zara', 'H&M', 'Allen Solly', 'Van Heusen', 'Peter England', 'Woodland', 'Bata',
    'Roadster', 'HRX', 'Wrogn', 'Peter England', 'Flying Machine', 'U.S. Polo Assn.',
    'US Polo', 'Red Tape', 'Allen Solly', 'Jack & Jones'
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

// Generates multiple mock items (from cheaper to higher prices)
const generateMockItems = (platform, query, baseProductInfo) => {
  const lowerQuery = query.toLowerCase();
  
  let basePrice = 1499;
  let categoryImage = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=60'; // shop
  let categoryBrands = ['Highlander', 'Roadster', 'Levi\'s'];
  let categoryNames = ['Standard Fit Shirt', 'Regular Casual Shirt', 'Premium Cotton Denim'];
  
  if (/iphone|samsung|pixel|phone|mobile/i.test(lowerQuery)) {
    basePrice = /iphone|samsung/i.test(lowerQuery) ? 64999 : 24999;
    categoryImage = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60';
    categoryBrands = ['OnePlus', 'Samsung', 'Apple'];
    categoryNames = ['Nord CE4 Lite', 'Galaxy S24 FE', 'iPhone 15 Pro'];
  } else if (/laptop|macbook|computer/i.test(lowerQuery)) {
    basePrice = 54999;
    categoryImage = 'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600&auto=format&fit=crop&q=60';
    categoryBrands = ['Acer', 'HP', 'Dell'];
    categoryNames = ['Aspire Slim Laptop', 'Pavilion Thin Book', 'Latitude Business Laptop'];
  } else if (/shoe|sneaker|footwear|sandal|heel|boot/i.test(lowerQuery)) {
    basePrice = 3499;
    categoryImage = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
    categoryBrands = ['Puma', 'Adidas', 'Nike'];
    categoryNames = ['Smash Sneaker', 'Run Falcon Runner', 'Air Max Trainer'];
  } else if (/headphones|earbuds|audio|speaker/i.test(lowerQuery)) {
    basePrice = 9999;
    categoryImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60';
    categoryBrands = ['boAt', 'JBL', 'Sony'];
    categoryNames = ['Rockerz Over-Ear', 'Tune 760NC Wireless', 'WH-CH720N Noise Cancelling'];
  } else if (/watch|smartwatch/i.test(lowerQuery)) {
    basePrice = 4999;
    categoryImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60';
    categoryBrands = ['Fastrack', 'Titan', 'Casio'];
    categoryNames = ['Reflex Smartwatch', 'Karishma Analog Dial', 'G-Shock Digital Watch'];
  } else if (/saree|kurta|shirt|tshirt|clothing|pant|jean|jeans/i.test(lowerQuery)) {
    basePrice = 799;
    categoryImage = 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=600&auto=format&fit=crop&q=60';
    categoryBrands = ['Highlander', 'Roadster', 'Levi\'s'];
    categoryNames = ['Regular Fit Denim Jeans', 'Super Slim Fit Jeans', '511 Styled Dark Jeans'];
  }

  let imageToUse = categoryImage;
  let titleToUse = query;
  let priceToUse = basePrice;
  let brandToUse = 'Generic';

  if (baseProductInfo) {
    imageToUse = baseProductInfo.image;
    titleToUse = baseProductInfo.title;
    priceToUse = baseProductInfo.lastPrice;
    brandToUse = baseProductInfo.brand || parseBrandFromTitle(titleToUse);
  }

  const items = [];
  const platformMultipliers = {
    Meesho: [0.80, 0.95, 1.10],
    Flipkart: [0.85, 1.00, 1.20],
    Amazon: [0.90, 1.05, 1.30]
  };

  const multipliers = platformMultipliers[platform] || [0.85, 1.00, 1.20];

  for (let i = 0; i < 3; i++) {
    const mult = multipliers[i];
    const itemPrice = Math.round(priceToUse * mult);
    let finalTitle = '';
    let finalBrand = '';

    if (baseProductInfo) {
      const brands = ['Highlander', 'Roadster', 'Levi\'s', 'Nike', 'Adidas', 'Sony', 'Apple', 'HP', 'Dell', 'Puma', 'JBL'];
      const altBrands = brands.filter(b => b.toLowerCase() !== brandToUse.toLowerCase());
      finalBrand = i === 1 ? brandToUse : (i === 0 ? altBrands[0] : altBrands[1]);
      
      const cleanedBaseTitle = titleToUse.replace(new RegExp(`^${brandToUse}`, 'i'), '').trim();
      finalTitle = `${finalBrand} ${cleanedBaseTitle}`;
    } else {
      finalBrand = categoryBrands[i];
      finalTitle = `${finalBrand} ${categoryNames[i]}`;
    }

    let url = '';
    if (platform === 'Amazon') url = formatAmazonUrl('', `${finalBrand} ${query}`);
    else if (platform === 'Flipkart') url = formatFlipkartUrl('', `${finalBrand} ${query}`);
    else if (platform === 'Meesho') url = formatMeeshoUrl('', `${finalBrand} ${query}`);

    items.push({
      platform,
      title: finalTitle,
      url,
      lastPrice: itemPrice,
      image: imageToUse,
      brand: finalBrand,
      lastScraped: new Date()
    });
  }

  return items;
};

/**
 * Scrape search results from Amazon
 */
const searchAmazon = async (query) => {
  try {
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { headers: getRandomHeaders(), timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    const matchedItems = [];
    $('a[href*="/dp/"]').each((idx, el) => {
      const href = $(el).attr('href');
      const title = $(el).find('img').attr('alt') || $(el).attr('title') || '';
      const img = $(el).find('img').attr('src');
      
      const parentContainer = $(el).closest('div.s-result-item');
      const priceText = parentContainer.find('.a-price-whole').first().text().trim() ||
                        parentContainer.find('.a-offscreen').first().text().trim();
      
      const parsedPrice = cleanPrice(priceText);
      
      if (parsedPrice && title && img && !title.includes('stars') && !title.includes('ratings')) {
        const titleText = title.trim();
        matchedItems.push({
          platform: 'Amazon',
          title: titleText,
          url: formatAmazonUrl(href, query),
          lastPrice: parsedPrice,
          image: img,
          brand: parseBrandFromTitle(titleText),
          lastScraped: new Date()
        });
        
        if (matchedItems.length >= 3) return false;
      }
    });

    if (matchedItems.length === 0) throw new Error('No items matched in HTML structure');
    return matchedItems;
  } catch (error) {
    console.warn(`Amazon Search Scrape failed (${error.message}).`);
    return null;
  }
};

/**
 * Scrape search results from Flipkart
 */
const searchFlipkart = async (query) => {
  try {
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { headers: getRandomHeaders(), timeout: 8000 });
    const $ = cheerio.load(response.data);

    const matchedItems = [];
    $('a[href*="/p/"]').each((idx, el) => {
      const href = $(el).attr('href');
      const title = $(el).find('img').attr('alt') || $(el).attr('title') || '';
      const img = $(el).find('img').attr('src');
      
      const containerText = $(el).text().trim() || $(el).parent().text().trim();
      const priceMatch = containerText.match(/₹\s*([0-9,]+)/);
      
      if (img && priceMatch) {
        const price = cleanPrice(priceMatch[0]);
        let titleText = title.trim();
        if (!titleText) {
          titleText = $(el).parent().find('a').first().text().trim();
        }
        titleText = titleText.replace(/₹.*/, '').replace(/Coming Soon.*/, '').trim();

        if (price && titleText) {
          matchedItems.push({
            platform: 'Flipkart',
            title: titleText,
            url: formatFlipkartUrl(href, query),
            lastPrice: price,
            image: img,
            brand: parseBrandFromTitle(titleText),
            lastScraped: new Date()
          });
          
          if (matchedItems.length >= 3) return false;
        }
      }
    });

    if (matchedItems.length === 0) throw new Error('No items matched in HTML structure');
    return matchedItems;
  } catch (error) {
    console.warn(`Flipkart Search Scrape failed (${error.message}).`);
    return null;
  }
};

/**
 * Scrape search results from Meesho
 */
const searchMeesho = async (query) => {
  try {
    const url = `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { headers: getRandomHeaders(), timeout: 8000 });
    const $ = cheerio.load(response.data);

    const matchedItems = [];
    $('p').each((i, el) => {
      const text = $(el).text();
      if (text.includes('₹') || text.includes('Rs.')) {
        const parentCard = $(el).closest('div');
        const titleEl = parentCard.find('p').first();
        const linkEl = parentCard.find('a').first();
        const imgEl = parentCard.find('img').first();

        const titleText = titleEl.text().trim();
        const priceVal = cleanPrice(text);

        if (titleText && priceVal && titleText !== text) {
          if (!matchedItems.some(item => item.title === titleText)) {
            matchedItems.push({
              platform: 'Meesho',
              title: titleText,
              url: formatMeeshoUrl(linkEl.attr('href'), query),
              lastPrice: priceVal,
              image: imgEl.attr('src') || '',
              brand: parseBrandFromTitle(titleText),
              lastScraped: new Date()
            });
            
            if (matchedItems.length >= 3) return false;
          }
        }
      }
    });

    if (matchedItems.length === 0) throw new Error('No items matched in HTML structure');
    return matchedItems;
  } catch (error) {
    console.warn(`Meesho Search Scrape failed (${error.message}).`);
    return null;
  }
};

/**
 * Trigger searches across Amazon, Flipkart, and Meesho and return comparison array
 */
export const searchAndCompare = async (query) => {
  console.log(`Executing comparison search for query: "${query}"`);
  
  const amazonResult = await searchAmazon(query).catch(() => null);
  const flipkartResult = await searchFlipkart(query).catch(() => null);
  const meeshoResult = await searchMeesho(query).catch(() => null);
  
  let baseProductInfo = null;
  const allRealItems = [...(amazonResult || []), ...(flipkartResult || []), ...(meeshoResult || [])];
  if (allRealItems.length > 0) {
    baseProductInfo = allRealItems.reduce((prev, curr) => (prev.lastPrice < curr.lastPrice ? prev : curr));
  }

  const finalAmazon = amazonResult || generateMockItems('Amazon', query, baseProductInfo);
  const finalFlipkart = flipkartResult || generateMockItems('Flipkart', query, baseProductInfo);
  const finalMeesho = meeshoResult || generateMockItems('Meesho', query, baseProductInfo);

  return [...finalAmazon, ...finalFlipkart, ...finalMeesho];
};
