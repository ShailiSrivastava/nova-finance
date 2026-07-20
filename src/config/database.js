const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const defaultDataDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../data');
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : defaultDataDir;
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.warn('Could not create data directory:', e.message);
  }
}

const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(dataDir, 'nova_finance.db');



const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper for promise-based query execution
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize database schema and performance indexes
async function initDatabase() {
  await dbRun('PRAGMA foreign_keys = ON;');

  // 1. Categories table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );
  `);

  // 2. Transactions table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Performance Optimization Indexes on high-frequency query fields
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);

  // 3. Budgets table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL UNIQUE,
      monthly_limit REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);`);

  // 4. Recurring Transactions table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      next_due_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Auto-Debit',
      auto_process INTEGER DEFAULT 1,
      last_processed_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Insert Default Categories if empty
  const countObj = await dbGet('SELECT COUNT(*) as count FROM categories');
  if (countObj.count === 0) {
    const defaultCategories = [
      { name: 'Salary & Income', type: 'income', icon: 'wallet', color: '#10b981' },
      { name: 'Freelancing & Side Hustle', type: 'income', icon: 'laptop', color: '#06b6d4' },
      { name: 'Investments & Returns', type: 'income', icon: 'trending-up', color: '#8b5cf6' },
      { name: 'Housing & Rent', type: 'expense', icon: 'home', color: '#ef4444' },
      { name: 'Groceries & Supplies', type: 'expense', icon: 'shopping-cart', color: '#f59e0b' },
      { name: 'Dining & Entertainment', type: 'expense', icon: 'utensils', color: '#ec4899' },
      { name: 'Utilities & Bills', type: 'expense', icon: 'zap', color: '#6366f1' },
      { name: 'Transportation & Fuel', type: 'expense', icon: 'car', color: '#14b8a6' },
      { name: 'Subscriptions & Software', type: 'expense', icon: 'film', color: '#a855f7' },
      { name: 'Healthcare & Wellness', type: 'expense', icon: 'activity', color: '#f43f5e' }
    ];

    for (const cat of defaultCategories) {
      await dbRun(
        'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
        [cat.name, cat.type, cat.icon, cat.color]
      );
    }
    console.log('Inserted default categories.');
  }

  console.log('Database schema and performance indexes initialized successfully.');
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDatabase
};
