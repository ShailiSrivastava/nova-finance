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

// API Routes
app.use('/api', apiRoutes);

// Fallback to index.html for SPA route handling
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Startup initialization sequence
async function startServer() {
  try {
    await initDatabase();

    // Check if transactions are empty; if so, automatically seed initial data
    const txCount = await dbGet('SELECT COUNT(*) as count FROM transactions');
    if (txCount.count === 0) {
      console.log('No transactions found. Seeding initial financial dataset...');
      await dbService.seedData();
    }

    // Run recurring transactions check on server startup
    await recurringEngine.processDue();

    // Schedule background checks for recurring transactions every 4 hours
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
  } catch (err) {
    console.error('Failed to start Nova Finance server:', err);
    process.exit(1);
  }
}

startServer();
