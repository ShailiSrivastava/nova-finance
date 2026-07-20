require('dotenv').config();

const express = require('express');

const cors = require('cors');
const compression = require('compression');
const path = require('path');

const { initDatabase, dbGet } = require('./src/config/database');
const dbService = require('./src/services/dbService');
const recurringEngine = require('./src/services/recurringEngine');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable response compression for performance optimization (Gzip)
app.use(compression());

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Lazy database initialization for serverless / local execution
let dbInitPromise = null;
async function ensureDbInit() {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await initDatabase();
      const txCount = await dbGet('SELECT COUNT(*) as count FROM transactions');
      if (txCount && txCount.count === 0) {
        console.log('No transactions found. Seeding initial financial dataset...');
        await dbService.seedData();
      }
      await recurringEngine.processDue();
    })();
  }
  return dbInitPromise;
}

// Middleware to ensure DB is initialized before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureDbInit();
    next();
  } catch (err) {
    console.error('Failed to initialize Nova Finance database:', err);
    next(err);
  }
});

// API Routes
app.use('/api', apiRoutes);

// Fallback to index.html for SPA route handling
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// If executed directly (node server.js), start standalone listener
if (require.main === module) {
  ensureDbInit().then(() => {
    setInterval(async () => {
      try {
        await recurringEngine.processDue();
      } catch (e) {
        console.error('Error in recurring transactions background job:', e);
      }
    }, 4 * 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`  🚀 Nova Finance Manager running on port ${PORT}`);
      console.log(`  🌐 Dashboard URL: http://localhost:${PORT}`);
      console.log(`  ⚡ Backend REST API: http://localhost:${PORT}/api/summary`);
      console.log(`===================================================`);
    });
  }).catch((err) => {
    console.error('Failed to start Nova Finance server:', err);
    process.exit(1);
  });
}

module.exports = app;

