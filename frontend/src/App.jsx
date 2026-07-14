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

// Normalize brand casing for display and filtering consistency
const normalizeBrand = (brand) => {
  if (!brand) return 'Generic';
  const trimmed = brand.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'hp') return 'HP';
  if (lower === 'dell') return 'Dell';
  if (lower === 'asus') return 'ASUS';
  if (lower === 'lg') return 'LG';
  if (lower === 'tv') return 'TV';
  if (lower === 'ikea') return 'IKEA';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Validate URL path is a product detail page
const isValidProductUrl = (url, platform) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) return false;
    
    const path = parsed.pathname;
    const lowerPlatform = platform.toLowerCase();
    
    if (lowerPlatform === 'flipkart') {
      return path.includes('/p/');
    }
    if (lowerPlatform === 'meesho') {
      return path.includes('/p/') || path.includes('/products/');
    }
    if (lowerPlatform === 'amazon') {
      return path.includes('/dp/') || path.includes('/gp/');
    }
    return true;
  } catch (e) {
    return false;
  }
};

const CATEGORY_FILTERS = {
  'Laptop': ['brand', 'ram', 'storage', 'processor', 'screenSize', 'color'],
  'Mobile': ['brand', 'ram', 'storage', 'color', 'network'],
  'Shirt / T-Shirt / Dress': ['brand', 'color', 'size', 'material', 'fit'],
  'Shoes / Slippers': ['brand', 'color', 'size', 'material', 'type'],
  'Watch': ['brand', 'color', 'strapMaterial', 'dialSize', 'type'],
  'TV': ['brand', 'screenSize', 'resolution', 'displayType'],
  'Furniture': ['brand', 'material', 'color', 'dimensions', 'type'],
  'Headphones': ['brand', 'color', 'wiredWireless', 'connectivity', 'type'],
  'Refrigerator': ['brand', 'capacity', 'doorType', 'energyRating', 'color'],
  'Washing Machine': ['brand', 'capacity', 'loadType', 'energyRating'],
  'AC': ['brand', 'tonnage', 'type', 'energyRating'],
  'Camera': ['brand', 'type', 'resolution', 'lensMount'],
  'Bag': ['brand', 'color', 'material', 'capacity', 'type'],
  'Beauty Products': ['brand', 'type', 'shade', 'skinHairType'],
  'Generic': ['brand']
};

const FILTER_DISPLAY_NAMES = {
  brand: 'Brand',
  ram: 'RAM',
  storage: 'Storage',
  processor: 'Processor',
  screenSize: 'Screen Size',
  color: 'Color',
  network: 'Network',
  size: 'Size',
  material: 'Material',
  fit: 'Fit',
  strapMaterial: 'Strap Material',
  dialSize: 'Dial/Case Size',
  type: 'Type',
  resolution: 'Resolution',
  displayType: 'Display Type',
  dimensions: 'Dimensions',
  wiredWireless: 'Wired/Wireless',
  connectivity: 'Connectivity',
  capacity: 'Capacity',
  doorType: 'Door Type',
  loadType: 'Load Type',
  energyRating: 'Energy Rating',
  tonnage: 'Tonnage',
  lensMount: 'Lens/Mount',
  shade: 'Shade/Variant',
  skinHairType: 'Skin/Hair Type'
};

// Category detection helper
const detectCategoryFromTitle = (title) => {
  const text = title.toLowerCase();
  if (/\b(laptop|notebook|macbook|chromebook|ultrabook|thinkpad|inspiron|pavilion|rog|zenbook|ideapad)\b/.test(text)) {
    return 'Laptop';
  }
  if (/\b(mobile|phone|smartphone|iphone|galaxy|pixel|oneplus|realme|redmi|poco|vivo|oppo|motorola)\b/.test(text)) {
    return 'Mobile';
  }
  if (/\b(shirt|tshirt|t-shirt|jeans|top|dress|saree|kurtas|kurti|clothing|jacket|coat|suit|hoodie|sweatshirt)\b/.test(text)) {
    return 'Shirt / T-Shirt / Dress';
  }
  if (/\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|slippers|footwear|loafers|crocs)\b/.test(text)) {
    return 'Shoes / Slippers';
  }
  if (/\b(watch|smartwatch|watches)\b/.test(text)) {
    return 'Watch';
  }
  if (/\b(tv|television|smarttv|led\s*tv|oled\s*tv|qled\s*tv)\b/.test(text)) {
    return 'TV';
  }
  if (/\b(furniture|sofa|bed|chair|chairs|table|tables|desk|desks|wardrobe|cabinet|cupboard|couch)\b/.test(text)) {
    return 'Furniture';
  }
  if (/\b(headphone|headphones|earphone|earphones|earbud|earbuds|tws|audio|soundbar|speaker|speakers)\b/.test(text)) {
    return 'Headphones';
  }
  if (/\b(fridge|refrigerator|cooler)\b/.test(text)) {
    return 'Refrigerator';
  }
  if (/\b(washing\s*machine|washer|dryer)\b/.test(text)) {
    return 'Washing Machine';
  }
  if (/\b(ac|air\s*conditioner|split\s*ac|window\s*ac)\b/.test(text)) {
    return 'AC';
  }
  if (/\b(camera|dslr|mirrorless|lens|gopro)\b/.test(text)) {
    return 'Camera';
  }
  if (/\b(bag|backpack|handbag|suitcase|duffel|luggage)\b/.test(text)) {
    return 'Bag';
  }
  if (/\b(lipstick|makeup|shampoo|conditioner|serum|lotion|cream|perfume|beauty|cosmetic)\b/.test(text)) {
    return 'Beauty Products';
  }
  return 'Generic';
};

// Build a clean, formatted variant label from extracted specs dynamically based on category
const buildVariantLabel = (specs, category = 'Generic') => {
  const keys = CATEGORY_FILTERS[category] || CATEGORY_FILTERS['Generic'];
  const parts = [];
  
  keys.forEach(k => {
    if (k !== 'brand' && specs[k]) {
      if (k === 'size') {
        parts.push(`Size ${specs[k]}`);
      } else {
        parts.push(specs[k]);
      }
    }
  });

  // Fallback for Generic to include any confidently extracted specs
  if (category === 'Generic') {
    const allKeys = ['ram', 'storage', 'processor', 'screenSize', 'color', 'network', 'size', 'material', 'fit', 'strapMaterial', 'dialSize', 'type', 'resolution', 'displayType', 'dimensions', 'wiredWireless', 'connectivity', 'capacity', 'doorType', 'loadType', 'energyRating', 'tonnage', 'lensMount', 'shade', 'skinHairType'];
    allKeys.forEach(k => {
      if (specs[k]) {
        if (k === 'size') parts.push(`Size ${specs[k]}`);
        else parts.push(specs[k]);
      }
    });
  }

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
                    lowerTitle.match(/size\s*(?::|is)?\s*([sml]|xl|xxl|xxxl|\d+)\b/i) ||
                    lowerTitle.match(/\b(s|m|l|xl|xxl|xxxl)\b/i);
  if (sizeMatch) {
    const group1 = (sizeMatch[1] || '').toLowerCase();
    const isPrefix = ['uk', 'us', 'eu'].includes(group1);
    const val = isPrefix ? (sizeMatch[2] || '') : (sizeMatch[1] || sizeMatch[2] || '');
    size = val.toUpperCase();
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
  
  // 10. Extract Network (Mobile)
  let network = null;
  const netMatch = lowerTitle.match(/\b(5g|4g\s*lte|4g|3g|lte)\b/i);
  if (netMatch) {
    network = netMatch[1].toUpperCase();
  }

  // 11. Extract Fit (Clothing)
  let fit = null;
  const fitMatch = lowerTitle.match(/\b(slim\s*fit|regular\s*fit|relaxed\s*fit|loose\s*fit)\b/i);
  if (fitMatch) {
    fit = fitMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // 12. Extract Strap Material (Watch)
  let strapMaterial = null;
  const strapMatch = lowerTitle.match(/\b(leather|silicone|metal|steel|chain|nylon|rubber|sport|resin)\s*(?:strap|band)\b/i);
  if (strapMatch) {
    strapMaterial = strapMatch[1].charAt(0).toUpperCase() + strapMatch[1].slice(1) + ' Strap';
  }

  // 13. Extract Dial/Case Size (Watch)
  let dialSize = null;
  const dialMatch = lowerTitle.match(/\b(\d+)\s*mm\b/i);
  if (dialMatch) {
    dialSize = `${dialMatch[1]}mm`;
  }

  // 14. Extract Display Type (TV)
  let displayType = null;
  const dispMatch = lowerTitle.match(/\b(oled|qled|amoled|lcd|led|ips|nanocell)\b/i);
  if (dispMatch) {
    displayType = dispMatch[1].toUpperCase();
  }

  // 15. Extract Dimensions (Furniture)
  let dimensions = null;
  const dimMatch = lowerTitle.match(/\b(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:feet|foot|inch|cm|ft)?\b/i) ||
                   lowerTitle.match(/\b(l-shaped|l\s*shape)\b/i);
  if (dimMatch) {
    dimensions = dimMatch[0].toUpperCase();
  }

  // 16. Extract Wired/Wireless (Headphones)
  let wiredWireless = null;
  if (lowerTitle.includes('wireless') || lowerTitle.includes('bluetooth') || lowerTitle.includes('tws')) {
    wiredWireless = 'Wireless';
  } else if (lowerTitle.includes('wired')) {
    wiredWireless = 'Wired';
  }

  // 17. Extract Connectivity (Headphones)
  let connectivity = null;
  const connMatch = lowerTitle.match(/\b(bluetooth|tws|noise\s*cancelling|anc|usb-c|aux)\b/i);
  if (connMatch) {
    connectivity = connMatch[1].toUpperCase() === 'ANC' ? 'ANC' : connMatch[1].toUpperCase() === 'TWS' ? 'TWS' : connMatch[1].charAt(0).toUpperCase() + connMatch[1].slice(1);
  }

  // 18. Extract Capacity (Refrigerator, Washing Machine, Bag)
  let capacity = null;
  const capMatch = lowerTitle.match(/(\d+(?:\.\d+)?)\s*(l|kg|litres|litre|ltr|ton|tons)/i);
  if (capMatch) {
    const val = capMatch[1];
    const unit = capMatch[2].toLowerCase();
    if (unit.startsWith('l')) capacity = `${val}L`;
    else if (unit.startsWith('k')) capacity = `${val} Kg`;
  }

  // 19. Extract Refrigerator Door Type
  let doorType = null;
  const doorMatch = lowerTitle.match(/\b(double\s*door|single\s*door|triple\s*door|side\s*by\s*side)\b/i);
  if (doorMatch) {
    doorType = doorMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // 20. Extract Washing Machine Load Type
  let loadType = null;
  const loadMatch = lowerTitle.match(/\b(front\s*load|top\s*load|semi\s*automatic|fully\s*automatic)\b/i);
  if (loadMatch) {
    loadType = loadMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // 21. Extract Energy Rating (Star Rating)
  let energyRating = null;
  const starMatch = lowerTitle.match(/\b(\d+)\s*star\b/i);
  if (starMatch) {
    energyRating = `${starMatch[1]} Star`;
  }

  // 22. Extract Tonnage (AC)
  let tonnage = null;
  const tonMatch = lowerTitle.match(/\b(\d+(?:\.\d+)?)\s*(ton|tons)\b/i);
  if (tonMatch) {
    tonnage = `${tonMatch[1]} Ton`;
  }

  // 23. Extract Lens/Mount (Camera)
  let lensMount = null;
  const lensMatch = lowerTitle.match(/\b(e-mount|f-mount|x-mount|ef-mount|lens|kit\s*lens)\b/i);
  if (lensMatch) {
    lensMount = lensMatch[1].toUpperCase();
  }

  // 24. Extract Beauty Products Shade/Variant
  let shade = null;
  const shadeMatch = lowerTitle.match(/\b(shade\s*\d+|red\s*ruby|matte|glossy|nude|pink|crimson)\b/i);
  if (shadeMatch) {
    shade = shadeMatch[1].charAt(0).toUpperCase() + shadeMatch[1].slice(1);
  }

  // 25. Extract Beauty Products Skin/Hair Type
  let skinHairType = null;
  const skinHairMatch = lowerTitle.match(/\b(oily|dry|normal|sensitive|combination|all)\s*(?:skin|hair)\b/i);
  if (skinHairMatch) {
    skinHairType = skinHairMatch[1].charAt(0).toUpperCase() + skinHairMatch[1].slice(1) + ' ' + (lowerTitle.includes('hair') ? 'Hair' : 'Skin');
  }

  // 26. Extract Category Specific Type
  let type = null;
  const shoeTypes = ['running', 'sneakers', 'boots', 'formal', 'loafers', 'crocs', 'slippers', 'sandals', 'sports', 'casual'];
  const watchTypes = ['smart', 'chronograph', 'hybrid', 'analog', 'digital'];
  const furnitureTypes = ['dining table', 'sofa couch', 'office desk', 'study desk', 'bed', 'wardrobe', 'cabinet', 'bookshelf'];
  const headphoneTypes = ['over-ear', 'on-ear', 'in-ear', 'earbuds', 'headphones'];
  const acTypes = ['split ac', 'window ac', 'inverter ac', 'portable ac'];
  const cameraTypes = ['dslr', 'mirrorless', 'action camera', 'point & shoot'];
  const bagTypes = ['backpack', 'handbag', 'suitcase', 'duffel', 'tote', 'laptop bag'];
  const beautyTypes = ['lipstick', 'makeup', 'shampoo', 'conditioner', 'serum', 'lotion', 'cream', 'face wash'];

  const allPrioritizedTypes = [
    ...shoeTypes,
    ...watchTypes,
    ...furnitureTypes,
    ...headphoneTypes,
    ...acTypes,
    ...cameraTypes,
    ...bagTypes,
    ...beautyTypes
  ];

  for (const t of allPrioritizedTypes) {
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    if (regex.test(lowerTitle)) {
      type = t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
    .replace(/\b(size|uk|us|eu|s|m|l|xl|xxl|xxxl)\b\s*\d*/gi, '')
    .replace(/[^a-zA-Z0-9\s\+\-\/\.]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+\d+$/g, '')
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
    resolution,
    network,
    fit,
    strapMaterial,
    dialSize,
    displayType,
    dimensions,
    wiredWireless,
    connectivity,
    capacity,
    doorType,
    loadType,
    energyRating,
    tonnage,
    lensMount,
    shade,
    skinHairType,
    type
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
  const [specFilters, setSpecFilters] = useState({
    ram: 'All',
    storage: 'All',
    processor: 'All',
    color: 'All',
    size: 'All',
    material: 'All',
    resolution: 'All',
    network: 'All',
    fit: 'All',
    strapMaterial: 'All',
    dialSize: 'All',
    displayType: 'All',
    dimensions: 'All',
    wiredWireless: 'All',
    connectivity: 'All',
    capacity: 'All',
    doorType: 'All',
    loadType: 'All',
    energyRating: 'All',
    tonnage: 'All',
    lensMount: 'All',
    shade: 'All',
    skinHairType: 'All',
    type: 'All'
  });

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
    setSpecFilters({
      ram: 'All',
      storage: 'All',
      processor: 'All',
      color: 'All',
      size: 'All',
      material: 'All',
      resolution: 'All',
      network: 'All',
      fit: 'All',
      strapMaterial: 'All',
      dialSize: 'All',
      displayType: 'All',
      dimensions: 'All',
      wiredWireless: 'All',
      connectivity: 'All',
      capacity: 'All',
      doorType: 'All',
      loadType: 'All',
      energyRating: 'All',
      tonnage: 'All',
      lensMount: 'All',
      shade: 'All',
      skinHairType: 'All',
      type: 'All'
    });
    
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
            const normalizedBrandNames = activeProduct.links
              .map(l => normalizeBrand(l.brand || parseBrandFromTitle(l.title)))
              .filter(Boolean);
            const uniqueBrands = ['All', ...new Set(normalizedBrandNames)];
            
            // Filter links by selected brand
            const brandFilteredLinks = selectedBrand === 'All' 
              ? activeProduct.links 
              : activeProduct.links.filter(l => normalizeBrand(l.brand || parseBrandFromTitle(l.title)).toLowerCase() === selectedBrand.toLowerCase());

            // Detect Category
            const detectedCategory = detectCategoryFromTitle(activeProduct.name) !== 'Generic'
              ? detectCategoryFromTitle(activeProduct.name)
              : (() => {
                  for (const l of activeProduct.links) {
                    const cat = detectCategoryFromTitle(l.title);
                    if (cat !== 'Generic') return cat;
                  }
                  return 'Generic';
                })();

            // Build unique products array (unique model + specs variant)
            const allBrandProducts = [];
            const productKeys = new Set();
            brandFilteredLinks.forEach(link => {
              const specs = parseSpecs(link.title, link.brand);
              const variantLabel = buildVariantLabel(specs, detectedCategory);
              const uniqueKey = `${specs.model}::${variantLabel}`;
              
              if (!productKeys.has(uniqueKey)) {
                productKeys.add(uniqueKey);
                allBrandProducts.push({
                  model: specs.model,
                  variant: variantLabel,
                  specs,
                  title: `${specs.brand} ${specs.model} ${variantLabel}`
                });
              }
            });

            // Dynamically collect filter options for ALL possible keys
            const allKeys = ['ram', 'storage', 'processor', 'screenSize', 'color', 'network', 'size', 'material', 'fit', 'strapMaterial', 'dialSize', 'type', 'resolution', 'displayType', 'dimensions', 'wiredWireless', 'connectivity', 'capacity', 'doorType', 'loadType', 'energyRating', 'tonnage', 'lensMount', 'shade', 'skinHairType'];
            const filterOptions = {};
            allKeys.forEach(k => {
              filterOptions[k] = new Set();
            });

            allBrandProducts.forEach(p => {
              allKeys.forEach(k => {
                if (p.specs[k]) {
                  filterOptions[k].add(p.specs[k]);
                }
              });
            });

            // Filter relevant keys for this category
            let filterKeys = CATEGORY_FILTERS[detectedCategory] || CATEGORY_FILTERS['Generic'];
            if (detectedCategory === 'Generic') {
              const activeKeys = ['brand'];
              allKeys.forEach(k => {
                if (filterOptions[k].size > 0) {
                  activeKeys.push(k);
                }
              });
              filterKeys = activeKeys;
            }

            // Filter products based on active Dynamic Filters
            const filteredProducts = allBrandProducts.filter(p => {
              for (const k of allKeys) {
                if (specFilters[k] && specFilters[k] !== 'All' && p.specs[k] !== specFilters[k]) {
                  return false;
                }
              }
              return true;
            });

            return (
              <div className="card brand-discovery-board" style={{ padding: '24px', marginBottom: '28px', border: '1.5px solid rgba(79, 70, 229, 0.1)', background: '#ffffff' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#4f46e5', marginBottom: '18px' }}>
                  <Search size={20} />
                  Product Finder & Dynamic Filters
                </h3>
                
                {/* 1. Brands Selection */}
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
                          setSpecFilters({
                            ram: 'All',
                            storage: 'All',
                            processor: 'All',
                            color: 'All',
                            size: 'All',
                            material: 'All',
                            resolution: 'All',
                            network: 'All',
                            fit: 'All',
                            strapMaterial: 'All',
                            dialSize: 'All',
                            displayType: 'All',
                            dimensions: 'All',
                            wiredWireless: 'All',
                            connectivity: 'All',
                            capacity: 'All',
                            doorType: 'All',
                            loadType: 'All',
                            energyRating: 'All',
                            tonnage: 'All',
                            lensMount: 'All',
                            shade: 'All',
                            skinHairType: 'All',
                            type: 'All'
                          });
                        }}
                        className={`btn ${selectedBrand === brand ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'capitalize' }}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Dynamic Spec Filters */}
                <div style={{ marginBottom: '20px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Dynamic Spec Filters
                    </label>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                      Category: {detectedCategory}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {filterKeys.map(k => {
                      if (k === 'brand') return null; // Brand selector is above
                      if (!filterOptions[k] || filterOptions[k].size === 0) return null;

                      const displayName = FILTER_DISPLAY_NAMES[k] || k;
                      return (
                        <div key={k}>
                          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                            {displayName}
                          </label>
                          <select 
                            value={specFilters[k] || 'All'}
                            onChange={(e) => setSpecFilters(prev => ({ ...prev, [k]: e.target.value }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#ffffff', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            <option value="All">All {displayName}</option>
                            {Array.from(filterOptions[k]).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Matching Products List */}
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                    Matching Products
                  </label>
                  {filteredProducts.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px 0' }}>No products match your active dynamic filters.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                      {filteredProducts.map(p => {
                        const isSelected = selectedModel === p.model && selectedVariant === p.variant;
                        return (
                          <div
                            key={`${p.model}-${p.variant}`}
                            onClick={() => {
                              setSelectedModel(p.model);
                              setSelectedVariant(p.variant);
                            }}
                            style={{
                              padding: '14px 16px',
                              background: isSelected ? 'rgba(79, 70, 229, 0.04)' : '#f8fafc',
                              border: isSelected ? '2px solid #4f46e5' : '1px solid var(--border-color)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            className="product-select-card"
                          >
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>
                              {p.specs.brand}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {p.model}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.variant}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Variant Selector Guard */}
          {(() => {
            if (!selectedVariant) {
              return (
                <div className="card guide-placeholder-card" style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc', border: '2px dashed var(--border-color)', borderRadius: '16px', marginBottom: '28px' }}>
                  <ShoppingBag size={48} style={{ color: '#4f46e5', margin: '0 auto 16px auto', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>Select Brand & Product Variant</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '8px auto 0 auto', lineHeight: '1.5' }}>
                    Please choose a brand and use the spec filters above to find your product and see live prices compared across stores.
                  </p>
                </div>
              );
            }

            // Filter links by brand and isolate modelGroups again
            const brandFilteredLinks = selectedBrand === 'All' 
              ? activeProduct.links 
              : activeProduct.links.filter(l => normalizeBrand(l.brand || parseBrandFromTitle(l.title)).toLowerCase() === selectedBrand.toLowerCase());

            const detectedCategory = detectCategoryFromTitle(activeProduct.name) !== 'Generic'
              ? detectCategoryFromTitle(activeProduct.name)
              : (() => {
                  for (const l of activeProduct.links) {
                    const cat = detectCategoryFromTitle(l.title);
                    if (cat !== 'Generic') return cat;
                  }
                  return 'Generic';
                })();

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
              const label = buildVariantLabel(item.specs, detectedCategory);
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
                      const brand = normalizeBrand(link.brand || parseBrandFromTitle(link.title));
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

                          {isValidProductUrl(featured.url, platform) ? (
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
                          ) : (
                            <button 
                              disabled 
                              className={btnClass} 
                              style={{ margin: '8px 0 16px 0', opacity: 0.6, cursor: 'not-allowed' }}
                            >
                              <span>Store Link Unavailable</span>
                            </button>
                          )}
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

                                const isUrlValid = isValidProductUrl(alt.url, platform);
                                const RowComponent = isUrlValid ? 'a' : 'div';
                                const rowProps = isUrlValid ? {
                                  href: alt.url,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  referrerPolicy: "no-referrer"
                                } : {};

                                return (
                                  <RowComponent 
                                    key={alt._id || idx}
                                    {...rowProps}
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
                                      transition: 'all 0.2s ease',
                                      cursor: isUrlValid ? 'pointer' : 'default'
                                    }}
                                    className={isUrlValid ? "alt-deal-row" : ""}
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
                                      {isUrlValid && <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />}
                                    </div>
                                  </RowComponent>
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
