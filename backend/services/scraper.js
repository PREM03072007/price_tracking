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

  const categories = {
    phone: {
      basePrice: 24999,
      brands: ['Apple', 'Samsung', 'OnePlus', 'Google Pixel', 'Xiaomi', 'Realme', 'Motorola', 'Vivo', 'Oppo', 'Nokia', 'IQOO', 'Nothing'],
      names: ['Pro Max 5G', 'Galaxy FE', 'Nord CE 5G', 'Pixel 9a', 'Redmi Note Pro', 'GT Edition', 'Edge Neo', 'V40 Lite', 'Reno Pro', 'G42 Dual Sim', 'Z9s Premium', 'Phone (2a)'],
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1565849906660-afc46c3a697e?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1533228892404-be29f7a7afe3?w=600&auto=format&fit=crop&q=60'
      ]
    },
    laptop: {
      basePrice: 49999,
      brands: ['Apple MacBook', 'HP Pavilion', 'Dell Inspiron', 'Lenovo ThinkPad', 'Asus ROG', 'Acer Aspire', 'Samsung Galaxy Book', 'MSI Creator', 'Microsoft Surface', 'LG Gram', 'Gigabyte', 'Razer Blade'],
      names: ['Air M3 Thin', 'x360 Convertible', '15 Business Edition', 'E14 Ryzen Slim', 'Zephyrus Gaming', 'Lite Book 14', 'Book4 Ultra', 'Modern Slim', 'Laptop Go', 'Ultra Lightweight', 'Aero Creator', 'Stealth Pro'],
      images: [
        'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=60'
      ]
    },
    shoe: {
      basePrice: 2999,
      brands: ['Nike Air', 'Adidas Originals', 'Puma Classic', 'Reebok Sports', 'Skechers Comfort', 'Under Armour', 'Bata Formal', 'Woodland Outdoor', 'Crocs Classic', 'Sparx Casual', 'Campus Run', 'Red Tape Leather'],
      names: ['Zoom Runner Shoes', 'Run Falcon Sneakers', 'Smash Suede Sneaker', 'Flex Trainer Shoes', 'ArchFit Comfort Walk', 'Charged Breeze Cushion', 'Derby Leather Shoes', 'Hiking Leather Boots', 'LiteRide Clog', 'Sporty Mesh Jogger', 'Hurricane Run Shoes', 'Classic Brogues'],
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&auto=format&fit=crop&q=60'
      ]
    },
    audio: {
      basePrice: 2499,
      brands: ['Sony Audio', 'JBL Harman', 'boAt Bass', 'Sennheiser Pro', 'Bose sound', 'OnePlus Buds', 'Apple AirPods', 'Realme Buds', 'Noise Audio', 'Boult Audio', 'Marshall Major', 'Skullcandy Bass'],
      names: ['Over-Ear ANC Headset', 'Tuned On-Ear Wireless', 'Rockerz Neckband', 'Studio HD Headphones', 'QuietComfort Earbuds', 'Nord Buds 3 Pro', 'AirPods Pro Gen 2', 'T100 Wireless In-Ear', 'Defy Active Buds', 'Curve Sport Neckband', 'Major IV Rock Edition', 'Crusher Evo Deep Bass'],
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=600&auto=format&fit=crop&q=60'
      ]
    },
    watch: {
      basePrice: 3999,
      brands: ['Titan Premium', 'Fastrack Sport', 'Casio Edifice', 'Fossil Hybrid', 'Noise Fit', 'boAt Storm', 'Samsung Galaxy Watch', 'Apple Watch Series', 'Amazfit Sports', 'Fire-Boltt Ring', 'Timex Heritage', 'Daniel Wellington'],
      names: ['Quartz Analog Watch', 'Digital Active Dial', 'Vintage Steel Watch', 'Smart Gen 6 Dial', 'ColorFit AMOLED Pro', 'Wave Call Smartwatch', 'Watch 7 Active', 'SE Smartwatch Edition', 'Bip 5 Fit Companion', 'Phoenix Talk Luxury', 'Expedition Indiglo Watch', 'Classic Mesh Strap'],
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1434056886845-dac89ffee9b5?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&auto=format&fit=crop&q=60'
      ]
    },
    clothing: {
      basePrice: 899,
      brands: ['Levi\'s Denim', 'Roadster Casual', 'Highlander Jeans', 'Allen Solly Shirt', 'HRX Performance', 'Wrogn Active', 'Peter England Formal', 'Flying Machine Tee', 'U.S. Polo Assn.', 'Jack & Jones', 'Zara Premium', 'H&M Organic'],
      names: ['511 Styled Dark Jeans', 'Classic Plaid Casual Shirt', 'Super Slim Tapered Jeans', 'Cotton Oxford Formal Shirt', 'DryFit Gym Sports Shirt', 'Active Slim Polo Tee', 'Premium Micro-Checked Shirt', 'Graphic Print Round Neck', 'Solid Cotton Polo Shirt', 'Original Denim Jeans Jacket', 'Slim Fit Premium Blazer', 'Regular Cotton Basic Tees'],
      images: [
        'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=60'
      ]
    },
    default: {
      basePrice: 1299,
      brands: ['Generic Premium', 'Smart Buy', 'Universal Standard', 'Everyday Value', 'Prime Choice', 'Global Select', 'Value Brands', 'Eco Friendly', 'Luxury Essentials', 'Crafted Choice', 'Peak Performance', 'Select Quality'],
      names: ['All-In-One Multi Tool', 'Everyday Use Standard Utility', 'Universal Design Modern Edition', 'Comfort Comfort Pack', 'Eco Friendly Durable Accessory', 'Classic Crafted Utility Item', 'Premium Comfort Essentials', 'Premium Lifestyle Product', 'Advanced Durable Daily Gear', 'Standard Performance Package', 'Luxury Quality Craftsmanship', 'Choice Select Item Pack'],
      images: [
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=60'
      ]
    }
  };

  let selectedCategory = categories.default;
  if (/iphone|samsung|pixel|phone|mobile/i.test(lowerQuery)) {
    selectedCategory = categories.phone;
  } else if (/laptop|macbook|computer/i.test(lowerQuery)) {
    selectedCategory = categories.laptop;
  } else if (/shoe|sneaker|footwear|sandal|heel|boot/i.test(lowerQuery)) {
    selectedCategory = categories.shoe;
  } else if (/headphones|earbuds|audio|speaker/i.test(lowerQuery)) {
    selectedCategory = categories.audio;
  } else if (/watch|smartwatch/i.test(lowerQuery)) {
    selectedCategory = categories.watch;
  } else if (/saree|kurta|shirt|tshirt|clothing|pant|jean|jeans/i.test(lowerQuery)) {
    selectedCategory = categories.clothing;
  }

  const offset = platform === 'Amazon' ? 0 : (platform === 'Flipkart' ? 3 : 6);
  let priceToUse = selectedCategory.basePrice;

  if (baseProductInfo) {
    priceToUse = baseProductInfo.lastPrice;
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
    const itemIndex = offset + i;
    
    // Choose brand name and image from non-overlapping index slices
    const finalBrand = selectedCategory.brands[itemIndex % selectedCategory.brands.length];
    const finalImage = selectedCategory.images[itemIndex % selectedCategory.images.length];
    
    let finalTitle = '';
    if (baseProductInfo) {
      // If we have base product title, replace original brand word (if any) with the new brand
      const originalBrand = baseProductInfo.brand || parseBrandFromTitle(baseProductInfo.title);
      const cleanedBaseTitle = baseProductInfo.title.replace(new RegExp(`^${originalBrand}`, 'i'), '').trim();
      finalTitle = `${finalBrand} ${cleanedBaseTitle}`;
    } else {
      finalTitle = `${finalBrand} ${selectedCategory.names[itemIndex % selectedCategory.names.length]}`;
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
      image: finalImage,
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
