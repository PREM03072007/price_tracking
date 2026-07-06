import axios from 'axios';
import * as cheerio from 'cheerio';

const testFlipkart = async () => {
  try {
    const url = 'https://www.flipkart.com/search?q=nike+shoe';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    };
    const response = await axios.get(url, { headers, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    console.log('--- Flipkart Links with "/p/" ---');
    $('a[href*="/p/"]').slice(0, 5).each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).attr('title') || $(el).text().trim();
      const img = $(el).find('img').attr('src');
      console.log(`Link ${i}: href=${href}`);
      console.log(`Title: ${title}`);
      console.log(`Image: ${img}`);
      
      // Look for price inside or near
      const priceText = $(el).find('div').filter((idx, div) => $(div).text().includes('₹')).first().text() ||
                        $(el).parent().find('div').filter((idx, div) => $(div).text().includes('₹')).first().text();
      console.log(`Price text near: ${priceText}`);
      console.log('-----------------');
    });

  } catch (err) {
    console.error('Flipkart test error:', err.message);
  }
};

testFlipkart();
