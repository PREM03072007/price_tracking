import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import PriceHistory from './models/PriceHistory.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/price_tracker');
    console.log('Connected to MongoDB for search seeding...');

    // Clear existing data
    await Product.deleteMany({});
    await PriceHistory.deleteMany({});
    console.log('Cleared old products and history cache.');

    // 1. Seed Products with search query mappings
    const products = [
      {
        name: 'Sony WH-1000XM5',
        description: 'Comparison search result cache for Sony WH-1000XM5',
        links: [
          { 
            platform: 'Amazon', 
            title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Over-Ear Headphones',
            url: 'https://www.amazon.in/s?k=Sony+WH-1000XM5', 
            lastPrice: 29990, 
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          },
          { 
            platform: 'Flipkart', 
            title: 'SONY WH-1000XM5 Bluetooth Headset with Active Noise Cancellation (ANC)',
            url: 'https://www.flipkart.com/search?q=Sony+WH-1000XM5', 
            lastPrice: 28490, 
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          },
          { 
            platform: 'Meesho', 
            title: 'Sony XM5 Noise Canceling Bluetooth Wireless Over-Ear Headphones',
            url: 'https://www.meesho.com/search?q=Sony+WH-1000XM5', 
            lastPrice: 27999, 
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          }
        ]
      },
      {
        name: 'iPhone 15',
        description: 'Comparison search result cache for iPhone 15',
        links: [
          { 
            platform: 'Amazon', 
            title: 'Apple iPhone 15 (128 GB) - Black',
            url: 'https://www.amazon.in/s?k=iPhone+15', 
            lastPrice: 65999, 
            image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          },
          { 
            platform: 'Flipkart', 
            title: 'Apple iPhone 15 (Black, 128 GB)',
            url: 'https://www.flipkart.com/search?q=iPhone+15', 
            lastPrice: 64999, 
            image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          },
          { 
            platform: 'Meesho', 
            title: 'Apple iPhone 15 Smartphone (128GB Storage, Black)',
            url: 'https://www.meesho.com/search?q=iPhone+15', 
            lastPrice: 63899, 
            image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          }
        ]
      },
      {
        name: 'Logitech MX Master 3S',
        description: 'Comparison search result cache for Logitech MX Master 3S',
        links: [
          { 
            platform: 'Amazon', 
            title: 'Logitech MX Master 3S Wireless Performance Mouse with Ultra-fast Scrolling',
            url: 'https://www.amazon.in/s?k=Logitech+MX+Master+3S', 
            lastPrice: 9495, 
            image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          },
          { 
            platform: 'Flipkart', 
            title: 'Logitech MX Master 3S Wireless Bluetooth Mouse (Graphite)',
            url: 'https://www.flipkart.com/search?q=Logitech+MX+Master+3S', 
            lastPrice: 8995, 
            image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          },
          { 
            platform: 'Meesho', 
            title: 'Logitech MX Master 3S Ergonomic Bluetooth Wireless Performance Mouse',
            url: 'https://www.meesho.com/search?q=Logitech+MX+Master+3S', 
            lastPrice: 8850, 
            image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=60',
            lastScraped: new Date() 
          }
        ]
      }
    ];

    const insertedProducts = await Product.insertMany(products);
    console.log(`Seeded ${insertedProducts.length} search queries.`);

    // 2. Seed Price History points (last 5 days)
    const historyEntries = [];

    insertedProducts.forEach((prod) => {
      prod.links.forEach((link) => {
        const basePrice = link.lastPrice;
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          const variation = (Math.random() - 0.5) * 0.06;
          const price = Math.round(basePrice * (1 + variation));

          historyEntries.push({
            product: prod._id,
            platform: link.platform,
            price: i === 0 ? basePrice : price,
            date: date
          });
        }
      });
    });

    await PriceHistory.insertMany(historyEntries);
    console.log(`Seeded ${historyEntries.length} price trend history points.`);

    console.log('DB Search seeding completed.');
    process.exit(0);

  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
