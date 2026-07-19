// Simple In-Memory TTL Cache for High-Frequency Analytical Endpoints
class CacheStore {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 60) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  clear() {
    this.cache.clear();
  }
}

const cacheStore = new CacheStore();

// Middleware to serve cached GET responses
const cacheMiddleware = (ttlSeconds = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedData = cacheStore.get(key);

    if (cachedData) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json(cachedData);
    }

    // Intercept res.json to save data into cache
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      res.setHeader('X-Cache-Status', 'MISS');
      cacheStore.set(key, data, ttlSeconds);
      return originalJson(data);
    };

    next();
  };
};

// Helper to flush cache when data is modified
const clearCache = () => {
  cacheStore.clear();
};

module.exports = {
  cacheMiddleware,
  clearCache
};
