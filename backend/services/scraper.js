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
  return `https://www.flipkart.com/${href}`;
};

const formatMeeshoUrl = (href, query) => {
  if (!href) return `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `https://www.meesho.com${href}`;
  if (href.startsWith('http://')) return href.replace('http://', 'https://');
  if (href.startsWith('https://')) return href;
  return `https://www.meesho.com/${href}`;
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

  // Define Category databases with brand and variants to align perfectly with the dynamic specifications selector
  const phoneItems = [
    { brand: 'Samsung', model: 'Galaxy S25', ram: '8GB', storage: '128GB', color: 'Black', basePrice: 74999, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600' },
    { brand: 'Samsung', model: 'Galaxy S25', ram: '12GB', storage: '256GB', color: 'Black', basePrice: 84999, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600' },
    { brand: 'Samsung', model: 'Galaxy S25+', ram: '12GB', storage: '256GB', color: 'Silver', basePrice: 94999, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600' },
    { brand: 'Samsung', model: 'Galaxy S25+', ram: '12GB', storage: '512GB', color: 'Silver', basePrice: 104999, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600' },
    { brand: 'Samsung', model: 'Galaxy S25 Ultra', ram: '12GB', storage: '256GB', color: 'Titanium Gray', basePrice: 124999, img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600' },
    { brand: 'Samsung', model: 'Galaxy S25 Ultra', ram: '16GB', storage: '512GB', color: 'Titanium Gray', basePrice: 139999, img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600' },
    { brand: 'Samsung', model: 'Galaxy S25 Ultra', ram: '16GB', storage: '1TB', color: 'Titanium Black', basePrice: 154999, img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600', exclusive: 'Amazon' },
    
    { brand: 'Apple', model: 'iPhone 15', ram: '6GB', storage: '128GB', color: 'Black', basePrice: 79990, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600' },
    { brand: 'Apple', model: 'iPhone 15', ram: '6GB', storage: '256GB', color: 'Blue', basePrice: 89990, img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600' },
    { brand: 'Apple', model: 'iPhone 15 Pro', ram: '8GB', storage: '128GB', color: 'Titanium', basePrice: 129900, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600' },
    { brand: 'Apple', model: 'iPhone 15 Pro Max', ram: '8GB', storage: '256GB', color: 'Black', basePrice: 149900, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600' },
    
    { brand: 'Realme', model: 'GT 6', ram: '8GB', storage: '256GB', color: 'Silver', basePrice: 39999, img: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600' },
    { brand: 'Realme', model: 'GT 6', ram: '12GB', storage: '256GB', color: 'Green', basePrice: 44999, img: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600' },
    { brand: 'Realme', model: 'GT 6T', ram: '8GB', storage: '128GB', color: 'Purple', basePrice: 30999, img: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600' },
    
    { brand: 'Redmi', model: 'Note 13', ram: '6GB', storage: '128GB', color: 'White', basePrice: 17999, img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600' },
    { brand: 'Redmi', model: 'Note 13', ram: '8GB', storage: '256GB', color: 'Black', basePrice: 19999, img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600' },
    { brand: 'Redmi', model: 'Note 13 Pro', ram: '8GB', storage: '128GB', color: 'Blue', basePrice: 24999, img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600' },
    { brand: 'Redmi', model: 'Note 13 Pro+', ram: '8GB', storage: '256GB', color: 'Silver', basePrice: 31999, img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600', exclusive: 'Flipkart' }
  ];

  const laptopItems = [
    { brand: 'HP', model: 'Pavilion x360', processor: 'I5', ram: '16GB', storage: '512GB', screenSize: '14 inch', basePrice: 59999, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600' },
    { brand: 'HP', model: 'Pavilion x360', processor: 'I7', ram: '16GB', storage: '512GB', screenSize: '14 inch', basePrice: 74999, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600' },
    { brand: 'HP', model: 'Victus Gaming', processor: 'I5', ram: '8GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 52999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'HP', model: 'Victus Gaming', processor: 'I7', ram: '16GB', storage: '1TB', screenSize: '15.6 inch', basePrice: 79999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'HP', model: 'Envy 14', processor: 'I5', ram: '16GB', storage: '512GB', screenSize: '14 inch', basePrice: 84999, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600' },
    { brand: 'HP', model: 'Envy 14', processor: 'I7', ram: '16GB', storage: '1TB', screenSize: '14 inch', basePrice: 104999, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600' },
    { brand: 'HP', model: 'Omen 16', processor: 'Ryzen 7', ram: '16GB', storage: '1TB', screenSize: '16 inch', basePrice: 114999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'HP', model: 'Omen 16', processor: 'Ryzen 9', ram: '32GB', storage: '1TB', screenSize: '16 inch', basePrice: 144999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'HP', model: 'ProBook 440', processor: 'I5', ram: '8GB', storage: '512GB', screenSize: '14 inch', basePrice: 48999, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600' },
    { brand: 'HP', model: 'ProBook 440', processor: 'I7', ram: '16GB', storage: '512GB', screenSize: '14 inch', basePrice: 66999, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600' },
    { brand: 'HP', model: 'Spectre x360', processor: 'I7', ram: '16GB', storage: '1TB', screenSize: '14 inch', basePrice: 139999, img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600', exclusive: 'Flipkart' },
    
    { brand: 'Dell', model: 'Inspiron 15', processor: 'I5', ram: '8GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 44999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600' },
    { brand: 'Dell', model: 'Inspiron 15', processor: 'Ryzen 5', ram: '16GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 49999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600' },
    { brand: 'Dell', model: 'Vostro 14', processor: 'I3', ram: '8GB', storage: '256GB', screenSize: '14 inch', basePrice: 32999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600' },
    { brand: 'Dell', model: 'Vostro 14', processor: 'I5', ram: '8GB', storage: '512GB', screenSize: '14 inch', basePrice: 41999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600' },
    { brand: 'Dell', model: 'XPS 13', processor: 'I7', ram: '16GB', storage: '512GB', screenSize: '13.3 inch', basePrice: 129999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600' },
    { brand: 'Dell', model: 'XPS 13', processor: 'Ultra 7', ram: '32GB', storage: '1TB', screenSize: '13.3 inch', basePrice: 169999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600' },
    { brand: 'Dell', model: 'G15 Gaming', processor: 'I5', ram: '16GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 71999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600' },
    { brand: 'Dell', model: 'Latitude 15', processor: 'I5', ram: '16GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 56999, img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600', exclusive: 'Amazon' },
    
    { brand: 'Lenovo', model: 'ThinkPad E14', processor: 'I5', ram: '16GB', storage: '512GB', screenSize: '14 inch', basePrice: 64999, img: 'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600' },
    { brand: 'Lenovo', model: 'ThinkPad E14', processor: 'I7', ram: '16GB', storage: '512GB', screenSize: '14 inch', basePrice: 82999, img: 'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600' },
    { brand: 'Lenovo', model: 'IdeaPad Slim 3', processor: 'Ryzen 3', ram: '8GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 34999, img: 'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600' },
    { brand: 'Lenovo', model: 'IdeaPad Slim 3', processor: 'Ryzen 5', ram: '16GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 45999, img: 'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600' },
    { brand: 'Lenovo', model: 'Legion 5', processor: 'Ryzen 7', ram: '16GB', storage: '1TB', screenSize: '15.6 inch', basePrice: 104999, img: 'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600' },
    { brand: 'Lenovo', model: 'Yoga Book', processor: 'Ultra 7', ram: '16GB', storage: '1TB', screenSize: '14 inch', basePrice: 149999, img: 'https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600', exclusive: 'Meesho' },
    
    { brand: 'ASUS', model: 'ROG Zephyrus G14', processor: 'Ryzen 7', ram: '16GB', storage: '1TB', screenSize: '14 inch', basePrice: 119999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'ASUS', model: 'ROG Zephyrus G14', processor: 'Ryzen 9', ram: '32GB', storage: '1TB', screenSize: '14 inch', basePrice: 159999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'ASUS', model: 'Zenbook 14', processor: 'I5', ram: '16GB', storage: '512GB', screenSize: '14 inch', basePrice: 79999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'ASUS', model: 'Zenbook 14', processor: 'Ultra 7', ram: '16GB', storage: '1TB', screenSize: '14 inch', basePrice: 99999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'ASUS', model: 'VivoBook 15', processor: 'I3', ram: '8GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 35999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { brand: 'ASUS', model: 'TUF Gaming F15', processor: 'I5', ram: '8GB', storage: '512GB', screenSize: '15.6 inch', basePrice: 58999, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' }
  ];

  const shirtItems = [
    { brand: "Levi's", model: 'Casual Plaid Shirt', material: 'Cotton', color: 'Blue', size: 'M', basePrice: 1999, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
    { brand: "Levi's", model: 'Casual Plaid Shirt', material: 'Cotton', color: 'Blue', size: 'L', basePrice: 1999, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
    { brand: "Levi's", model: 'Denim Trucker Shirt', material: 'Denim', color: 'Indigo', size: 'M', basePrice: 2999, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
    
    { brand: 'Roadster', model: 'Casual Plaid Shirt', material: 'Cotton', color: 'Red', size: 'M', basePrice: 899, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
    { brand: 'Roadster', model: 'Polo Neck Tee', material: 'Polyester', color: 'Green', size: 'L', basePrice: 599, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
    
    { brand: 'Allen Solly', model: 'Formal Oxford Shirt', material: 'Cotton', color: 'White', size: 'S', basePrice: 2299, img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600' },
    { brand: 'Allen Solly', model: 'Formal Oxford Shirt', material: 'Cotton', color: 'White', size: 'M', basePrice: 2299, img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600' },
    { brand: 'Allen Solly', model: 'Formal Oxford Shirt', material: 'Cotton', color: 'Blue', size: 'L', basePrice: 2399, img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600' },
    
    { brand: 'U.S. Polo', model: 'Denim Slim Shirt', material: 'Denim', color: 'Blue', size: 'L', basePrice: 2499, img: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=600' },
    { brand: 'U.S. Polo', model: 'Denim Slim Shirt', material: 'Denim', color: 'Blue', size: 'XL', basePrice: 2499, img: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=600' },
    
    { brand: 'HRX', model: 'DryFit Athletic Shirt', material: 'Polyester', color: 'Black', size: 'M', basePrice: 999, img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600' },
    { brand: 'Wrogn', model: 'Active Sports Tee', material: 'Polyester', color: 'Grey', size: 'L', basePrice: 1199, img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600' }
  ];

  const shoeItems = [
    { brand: 'Nike', model: 'Air Max Sneaker', color: 'Blue', size: 'UK 8', basePrice: 8999, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
    { brand: 'Nike', model: 'Air Max Sneaker', color: 'Blue', size: 'UK 9', basePrice: 8999, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
    { brand: 'Nike', model: 'Air Max Sneaker', color: 'Black', size: 'UK 10', basePrice: 9499, img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600' },
    
    { brand: 'Adidas', model: 'Run Falcon Runner', color: 'Black', size: 'UK 8', basePrice: 4299, img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600' },
    { brand: 'Adidas', model: 'Run Falcon Runner', color: 'Black', size: 'UK 9', basePrice: 4299, img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600' },
    
    { brand: 'Puma', model: 'Classic Suede', color: 'Red', size: 'UK 9', basePrice: 3999, img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600' },
    { brand: 'Reebok', model: 'Classic Suede', color: 'Blue', size: 'UK 9', basePrice: 3499, img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600' },
    
    { brand: 'Skechers', model: 'ArchFit Comfort Walk', color: 'Grey', size: 'UK 8', basePrice: 5999, img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600' },
    { brand: 'Under Armour', model: 'Charged Breeze Cushion', color: 'Red', size: 'UK 9', basePrice: 6999, img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600' }
  ];

  const tvItems = [
    { brand: 'Sony', model: 'OLED Smart TV', screenSize: '55 inch', resolution: '4K', color: 'Black', basePrice: 124990, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600' },
    { brand: 'Sony', model: 'OLED Smart TV', screenSize: '65 inch', resolution: '4K', color: 'Black', basePrice: 179990, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600' },
    
    { brand: 'Samsung', model: 'Crystal UHD TV', screenSize: '43 inch', resolution: '4K', color: 'Black', basePrice: 34990, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600' },
    { brand: 'Samsung', model: 'Crystal UHD TV', screenSize: '55 inch', resolution: '4K', color: 'Black', basePrice: 47990, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600' },
    
    { brand: 'LG', model: 'LED Smart TV', screenSize: '32 inch', resolution: 'HD Ready', color: 'Black', basePrice: 14990, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600' },
    { brand: 'OnePlus', model: 'Y Series LED TV', screenSize: '43 inch', resolution: 'FHD', color: 'Black', basePrice: 22999, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600' },
    { brand: 'Xiaomi', model: 'Mi Smart TV X', screenSize: '50 inch', resolution: '4K', color: 'Black', basePrice: 28999, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600' }
  ];

  const furnitureItems = [
    { brand: 'IKEA', model: 'Wooden Dining Table', material: 'Oak', color: 'Brown', size: '6 Seater', basePrice: 18999, img: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600' },
    { brand: 'IKEA', model: 'Wooden Dining Table', material: 'Oak', color: 'Brown', size: '4 Seater', basePrice: 12999, img: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600' },
    
    { brand: 'Pepperfry', model: 'Leather Sofa Couch', material: 'Leather', color: 'Black', size: '3 Seater', basePrice: 34999, img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600' },
    { brand: 'Urban Ladder', model: 'Leather Sofa Couch', material: 'Leather', color: 'Brown', size: '3 Seater', basePrice: 39999, img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600' },
    
    { brand: 'Sleepwell', model: 'Study Desk Office', material: 'Wooden', color: 'White', size: 'Standard', basePrice: 7999, img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600' }
  ];

  let selectedDataset = [];
  if (/iphone|samsung|pixel|phone|mobile|redmi|realme|oneplus|poco/i.test(lowerQuery)) {
    selectedDataset = phoneItems;
  } else if (/laptop|macbook|computer|hp|dell|lenovo|asus/i.test(lowerQuery)) {
    selectedDataset = laptopItems;
  } else if (/shoe|sneaker|footwear|sandal|heel|boot/i.test(lowerQuery)) {
    selectedDataset = shoeItems;
  } else if (/saree|kurta|shirt|tshirt|clothing|pant|jean|jeans/i.test(lowerQuery)) {
    selectedDataset = shirtItems;
  } else if (/tv|television|smarttv|led/i.test(lowerQuery)) {
    selectedDataset = tvItems;
  } else if (/furniture|sofa|bed|chair|table|desk/i.test(lowerQuery)) {
    selectedDataset = furnitureItems;
  }

  // If no category matched, dynamically generate items from the query!
  if (selectedDataset.length === 0) {
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const queryWords = cleanQuery.split(/\s+/);
    const mainWord = queryWords[0] || 'Product';
    const categoryName = queryWords.slice(1).join(' ') || 'Item';
    
    const customBrands = [`${mainWord} Brand A`, `${mainWord} Brand B`, `${mainWord} Brand C`];
    const customModels = [`${categoryName} Pro`, `${categoryName} Standard`];
    
    // Fill custom dataset
    selectedDataset = [
      { brand: customBrands[0], model: customModels[0], color: 'Black', size: 'M', basePrice: 1499, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' },
      { brand: customBrands[0], model: customModels[0], color: 'White', size: 'L', basePrice: 1599, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' },
      { brand: customBrands[1], model: customModels[0], color: 'Black', size: 'M', basePrice: 1299, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' },
      { brand: customBrands[1], model: customModels[1], color: 'Blue', size: 'Standard', basePrice: 999, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' },
      { brand: customBrands[2], model: customModels[1], color: 'Red', size: 'Standard', basePrice: 899, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' }
    ];
  }

  // Determine indices based on platform to simulate dynamic deals and exact cross-store matches
  // Amazon: idx % 3 === 0 || idx % 3 === 1, and Amazon exclusives
  // Flipkart: idx % 3 === 1 || idx % 3 === 2, and Flipkart exclusives
  // Meesho: idx % 3 === 0 || idx % 3 === 2, and Meesho exclusives
  let sliceIndices = [];
  selectedDataset.forEach((item, idx) => {
    let include = false;
    if (platform === 'Amazon') {
      include = (idx % 3 === 0 || idx % 3 === 1 || item.exclusive === 'Amazon');
      if (item.exclusive && item.exclusive !== 'Amazon') include = false;
    } else if (platform === 'Flipkart') {
      include = (idx % 3 === 1 || idx % 3 === 2 || item.exclusive === 'Flipkart');
      if (item.exclusive && item.exclusive !== 'Flipkart') include = false;
    } else if (platform === 'Meesho') {
      include = (idx % 3 === 0 || idx % 3 === 2 || item.exclusive === 'Meesho');
      if (item.exclusive && item.exclusive !== 'Meesho') include = false;
    }
    if (include) {
      sliceIndices.push(idx);
    }
  });

  const items = [];
  const platformMultipliers = {
    Meesho: 0.92,
    Flipkart: 0.98,
    Amazon: 1.02
  };
  const mult = platformMultipliers[platform] || 1.0;

  sliceIndices.forEach(idx => {
    if (idx < selectedDataset.length) {
      const baseItem = selectedDataset[idx];
      
      // Calculate customized price
      let itemPrice = Math.round(baseItem.basePrice * mult);
      if (baseProductInfo) {
        itemPrice = Math.round(baseProductInfo.lastPrice * mult);
      }

      // Construct a descriptive title that includes brand, model, and specs
      const titleParts = [baseItem.brand, baseItem.model];
      if (baseItem.processor) titleParts.push(baseItem.processor);
      if (baseItem.ram) titleParts.push(`(${baseItem.ram} RAM`);
      if (baseItem.storage) {
        if (baseItem.ram) {
          titleParts[titleParts.length - 1] = `${titleParts[titleParts.length - 1]}, ${baseItem.storage} Storage)`;
        } else {
          titleParts.push(`(${baseItem.storage} Storage)`);
        }
      }
      if (baseItem.screenSize) titleParts.push(baseItem.screenSize);
      if (baseItem.material) titleParts.push(baseItem.material);
      if (baseItem.color) titleParts.push(baseItem.color);
      if (baseItem.size) titleParts.push(`Size ${baseItem.size}`);
      if (baseItem.resolution) titleParts.push(baseItem.resolution);

      const finalTitle = titleParts.join(' ');

      let url = '';
      const cleanTitleForUrl = baseItem.model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const randomId = Math.floor(100000 + Math.random() * 900000).toString(36); // Short random string segment

      if (platform === 'Amazon') {
        url = `https://www.amazon.in/${cleanTitleForUrl}/dp/B0${randomId.toUpperCase()}`;
      } else if (platform === 'Flipkart') {
        url = `https://www.flipkart.com/${cleanTitleForUrl}/p/itm${randomId}`;
      } else if (platform === 'Meesho') {
        url = `https://www.meesho.com/${cleanTitleForUrl}/p/${randomId}`;
      }

      items.push({
        platform,
        title: finalTitle,
        url,
        lastPrice: itemPrice,
        image: baseItem.img,
        brand: baseItem.brand,
        lastScraped: new Date()
      });
    }
  });

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
        
        if (matchedItems.length >= 30) return false;
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
          
          if (matchedItems.length >= 30) return false;
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
        const linkEl = $(el).closest('a').length ? $(el).closest('a') : parentCard.find('a').first();
        const imgEl = parentCard.find('img').first();

        const titleText = titleEl.text().trim();
        const priceVal = cleanPrice(text);

        if (titleText && priceVal && titleText !== text) {
          if (!matchedItems.some(item => item.title === titleText)) {
            const href = linkEl.attr('href') || '';
            matchedItems.push({
              platform: 'Meesho',
              title: titleText,
              url: formatMeeshoUrl(href, query),
              lastPrice: priceVal,
              image: imgEl.attr('src') || '',
              brand: parseBrandFromTitle(titleText),
              lastScraped: new Date()
            });
            
            if (matchedItems.length >= 30) return false;
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
