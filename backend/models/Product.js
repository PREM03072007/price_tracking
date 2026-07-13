import mongoose from 'mongoose';

const platformLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  title: { type: String, default: '' },
  url: { type: String, default: '' },
  lastPrice: { type: Number, default: null },
  image: { type: String, default: '' },
  brand: { type: String, default: '' },
  lastScraped: { type: Date, default: null }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // The search query, e.g. "Sony XM5"
  description: { type: String, default: '' },
  links: [platformLinkSchema], // Cached comparison results
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
