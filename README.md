# PriceSpy - Smart E-Commerce Price Monitor

PriceSpy is a modern, responsive web application built on the **MERN (MongoDB, Express, React, Node.js) Stack** designed to compare product prices in real-time across multiple Indian e-commerce platforms: **Amazon**, **Flipkart**, and **Meesho**.

The application utilizes layout-independent web scraping techniques to extract matched products, current prices, images, and shop links directly from search queries. It features a stunning light-themed glassmorphic UI dashboard and price history tracking graphs.

---

## Key Features

- **Live Product Search**: Type a product name and fetch matching listings and prices on Amazon, Flipkart, and Meesho.
- **Cheapest Store Finder**: Automatically highlights the platform with the lowest price.
- **Access Denial Bypass**: Uses advanced headers and a `no-referrer` redirection policy to bypass CDN restrictions (Akamai Edgesuite) on e-commerce sites.
- **Price History Graphs**: Visualizes historical price changes over time using interactive line charts powered by Recharts.
- **Searches Caching**: Speeds up response times by caching search queries in MongoDB, auto-refreshing logs after 1 hour.
- **Recent Searches**: One-click shortcuts to previous search terms.

---

## Tech Stack

- **Frontend**: React (Vite), Recharts, Lucide Icons, Custom Light Theme CSS
- **Backend**: Node.js, Express, Axios, Cheerio (Web Scraper)
- **Database**: MongoDB (Mongoose)

---

## Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and a local instance of [MongoDB](https://www.mongodb.com/) running on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/PREM03072007/price_tracking.git
cd price_tracking
```

### 2. Install Dependencies
You can install dependencies for both the frontend and backend with a single command from the project root:
```bash
npm run install-all
```

### 3. Run the Application
Start both the React development server and the Node.js Express server concurrently using:
```bash
npm start
```

- **Frontend client** will open at: [http://localhost:5174/](http://localhost:5174/) (or check terminal logs)
- **Backend API server** will run on: [http://localhost:5001/](http://localhost:5001/)
