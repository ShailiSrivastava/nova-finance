const { dbRun, dbAll, dbGet } = require('../config/database');

class DBService {
  // --- CATEGORIES ---
  async getCategories() {
    return await dbAll('SELECT * FROM categories ORDER BY name ASC');
  }

  // --- TRANSACTIONS ---
  async getTransactions({ search, categoryId, type, startDate, endDate, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (t.description LIKE ? OR t.notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (categoryId) {
      sql += ` AND t.category_id = ?`;
      params.push(categoryId);
    }

    if (type) {
      sql += ` AND t.type = ?`;
      params.push(type);
    }

    if (startDate) {
      sql += ` AND t.date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND t.date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await dbAll(sql, params);
  }

  async countTransactions({ search, categoryId, type, startDate, endDate } = {}) {
    let sql = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (t.description LIKE ? OR t.notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      sql += ` AND t.category_id = ?`;
      params.push(categoryId);
    }
    if (type) {
      sql += ` AND t.type = ?`;
      params.push(type);
    }
    if (startDate) {
      sql += ` AND t.date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND t.date <= ?`;
      params.push(endDate);
    }

    const res = await dbGet(sql, params);
    return res.total;
  }

  async addTransaction({ description, amount, type, category_id, date, payment_method, notes }) {
    const sql = `
      INSERT INTO transactions (description, amount, type, category_id, date, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const res = await dbRun(sql, [description, amount, type, category_id, date, payment_method || 'Bank Transfer', notes || '']);
    return await this.getTransactionById(res.lastID);
  }

  async getTransactionById(id) {
    const sql = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `;
    return await dbGet(sql, [id]);
  }

  async updateTransaction(id, { description, amount, type, category_id, date, payment_method, notes }) {
    const sql = `
      UPDATE transactions 
      SET description = ?, amount = ?, type = ?, category_id = ?, date = ?, payment_method = ?, notes = ?
      WHERE id = ?
    `;
    await dbRun(sql, [description, amount, type, category_id, date, payment_method, notes, id]);
    return await this.getTransactionById(id);
  }

  async deleteTransaction(id) {
    return await dbRun('DELETE FROM transactions WHERE id = ?', [id]);
  }

  // --- BUDGETS ---
  async getBudgets() {
    // Current month string 'YYYY-MM'
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7); // e.g. '2026-07'

    const sql = `
      SELECT 
        b.id,
        b.category_id,
        b.monthly_limit,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(SUM(t.amount), 0) as current_spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON t.category_id = b.category_id 
        AND t.type = 'expense' 
        AND strftime('%Y-%m', t.date) = ?
      GROUP BY b.id, b.category_id, b.monthly_limit, c.name, c.icon, c.color
      ORDER BY (COALESCE(SUM(t.amount), 0) / b.monthly_limit) DESC
    `;
    return await dbAll(sql, [currentMonthPrefix]);
  }

  async setBudget({ category_id, monthly_limit }) {
    const existing = await dbGet('SELECT id FROM budgets WHERE category_id = ?', [category_id]);
    if (existing) {
      await dbRun('UPDATE budgets SET monthly_limit = ? WHERE category_id = ?', [monthly_limit, category_id]);
      return { id: existing.id, category_id, monthly_limit };
    } else {
      const res = await dbRun('INSERT INTO budgets (category_id, monthly_limit) VALUES (?, ?)', [category_id, monthly_limit]);
      return { id: res.lastID, category_id, monthly_limit };
    }
  }

  async deleteBudget(id) {
    return await dbRun('DELETE FROM budgets WHERE id = ?', [id]);
  }

  // --- RECURRING TRANSACTIONS ---
  async getRecurringTransactions() {
    const sql = `
      SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM recurring_transactions r
      JOIN categories c ON r.category_id = c.id
      ORDER BY r.next_due_date ASC
    `;
    return await dbAll(sql);
  }

  async addRecurringTransaction({ description, amount, type, category_id, frequency, next_due_date, payment_method, auto_process }) {
    const sql = `
      INSERT INTO recurring_transactions (description, amount, type, category_id, frequency, next_due_date, payment_method, auto_process)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const res = await dbRun(sql, [description, amount, type, category_id, frequency, next_due_date, payment_method || 'Auto-Debit', auto_process !== undefined ? auto_process : 1]);
    return await dbGet(`SELECT r.*, c.name as category_name FROM recurring_transactions r JOIN categories c ON r.category_id = c.id WHERE r.id = ?`, [res.lastID]);
  }

  async deleteRecurringTransaction(id) {
    return await dbRun('DELETE FROM recurring_transactions WHERE id = ?', [id]);
  }

  // --- SUMMARY & ANALYTICS ---
  async getSummary() {
    const incomeObj = await dbGet(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`);
    const expenseObj = await dbGet(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`);
    const totalCountObj = await dbGet(`SELECT COUNT(*) as count FROM transactions`);

    const totalIncome = incomeObj.total;
    const totalExpense = expenseObj.total;
    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;

    // Current month metrics
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthIncomeObj = await dbGet(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?`, [currentMonthStr]);
    const monthExpenseObj = await dbGet(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`, [currentMonthStr]);

    return {
      totalBalance: netBalance,
      totalIncome,
      totalExpense,
      savingsRate: parseFloat(savingsRate),
      currentMonth: {
        month: currentMonthStr,
        income: monthIncomeObj.total,
        expense: monthExpenseObj.total,
        net: monthIncomeObj.total - monthExpenseObj.total
      },
      transactionCount: totalCountObj.count
    };
  }

  async getAnalytics() {
    // 1. Expense Breakdown by Category
    const categoryBreakdown = await dbAll(`
      SELECT 
        c.name as category,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0) as amount,
        COUNT(t.id) as count
      FROM categories c
      JOIN transactions t ON t.category_id = c.id
      WHERE t.type = 'expense'
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY amount DESC
    `);

    // 2. Monthly Trend (Last 6 Months)
    const monthlyTrend = await dbAll(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
      LIMIT 12
    `);

    // 3. Payment Method Breakdown
    const paymentMethods = await dbAll(`
      SELECT 
        payment_method as method,
        COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense'
      GROUP BY payment_method
      ORDER BY total DESC
    `);

    // 4. Smart Financial Insights
    const topExpenseCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
    const summary = await this.getSummary();

    const insights = [];
    if (topExpenseCategory) {
      const percentage = summary.totalExpense > 0 ? ((topExpenseCategory.amount / summary.totalExpense) * 100).toFixed(1) : 0;
      insights.push({
        title: 'Top Expense Category',
        text: `${topExpenseCategory.category} accounts for ${percentage}% of total expenses ($${topExpenseCategory.amount.toLocaleString()}).`,
        type: 'warning'
      });
    }

    if (summary.savingsRate > 20) {
      insights.push({
        title: 'Healthy Savings Rate',
        text: `Your current net savings rate is ${summary.savingsRate}%, exceeding the 20% financial benchmark!`,
        type: 'success'
      });
    } else if (summary.savingsRate >= 0) {
      insights.push({
        title: 'Savings Opportunity',
        text: `Your current net savings rate is ${summary.savingsRate}%. Consider reviewing subscription and dining budgets to reach a 20% goal.`,
        type: 'info'
      });
    } else {
      insights.push({
        title: 'Deficit Alert',
        text: `Expenses exceed total income by $${Math.abs(summary.totalBalance).toLocaleString()}. Review budgets immediately.`,
        type: 'danger'
      });
    }

    return {
      categoryBreakdown,
      monthlyTrend,
      paymentMethods,
      insights
    };
  }

  // --- SEEDING DATA ---
  async seedData() {
    await dbRun('DELETE FROM transactions;');
    await dbRun('DELETE FROM budgets;');
    await dbRun('DELETE FROM recurring_transactions;');

    const categories = await this.getCategories();
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c.id; });

    // Seed Budgets
    const budgetList = [
      { name: 'Groceries & Supplies', limit: 600 },
      { name: 'Dining & Entertainment', limit: 350 },
      { name: 'Utilities & Bills', limit: 250 },
      { name: 'Housing & Rent', limit: 1600 },
      { name: 'Transportation & Fuel', limit: 200 },
      { name: 'Subscriptions & Software', limit: 100 }
    ];

    for (const b of budgetList) {
      if (catMap[b.name]) {
        await this.setBudget({ category_id: catMap[b.name], monthly_limit: b.limit });
      }
    }

    // Seed Recurring Transactions
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const recurringList = [
      { description: 'Tech Corp Monthly Salary', amount: 4800, type: 'income', category: 'Salary & Income', frequency: 'monthly', date: todayStr, method: 'Direct Deposit' },
      { description: 'Apartment Rent Payment', amount: 1500, type: 'expense', category: 'Housing & Rent', frequency: 'monthly', date: todayStr, method: 'Bank Transfer' },
      { description: 'Netflix & Spotify Subscriptions', amount: 28, type: 'expense', category: 'Subscriptions & Software', frequency: 'monthly', date: todayStr, method: 'Credit Card' },
      { description: 'High-Speed Internet Bill', amount: 75, type: 'expense', category: 'Utilities & Bills', frequency: 'monthly', date: todayStr, method: 'Auto-Debit' }
    ];

    for (const r of recurringList) {
      if (catMap[r.category]) {
        await this.addRecurringTransaction({
          description: r.description,
          amount: r.amount,
          type: r.type,
          category_id: catMap[r.category],
          frequency: r.frequency,
          next_due_date: r.date,
          payment_method: r.method,
          auto_process: 1
        });
      }
    }

    // Generate 6 months of historical transactions
    const sampleTransactions = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yearMonth = d.toISOString().slice(0, 7);

      // Monthly Salary
      sampleTransactions.push({
        description: 'Monthly Paycheck - Tech Corp',
        amount: 4800,
        type: 'income',
        category_id: catMap['Salary & Income'],
        date: `${yearMonth}-01`,
        payment_method: 'Direct Deposit',
        notes: 'Regular salary'
      });

      // Side hustle freelance work occasionally
      if (i % 2 === 0) {
        sampleTransactions.push({
          description: 'Freelance Web Design Client',
          amount: 850 + (i * 100),
          type: 'income',
          category_id: catMap['Freelancing & Side Hustle'],
          date: `${yearMonth}-14`,
          payment_method: 'Bank Transfer',
          notes: 'Client UI redesign work'
        });
      }

      // Rent
      sampleTransactions.push({
        description: 'Monthly Apartment Rent',
        amount: 1500,
        type: 'expense',
        category_id: catMap['Housing & Rent'],
        date: `${yearMonth}-02`,
        payment_method: 'Bank Transfer',
        notes: 'Rent'
      });

      // Groceries (2-3 times per month)
      sampleTransactions.push({
        description: 'Whole Foods Market',
        amount: 185.40,
        type: 'expense',
        category_id: catMap['Groceries & Supplies'],
        date: `${yearMonth}-05`,
        payment_method: 'Credit Card',
        notes: 'Weekly groceries'
      });
      sampleTransactions.push({
        description: 'Trader Joe\'s Grocery Run',
        amount: 142.10,
        type: 'expense',
        category_id: catMap['Groceries & Supplies'],
        date: `${yearMonth}-18`,
        payment_method: 'Credit Card',
        notes: 'Groceries'
      });

      // Dining
      sampleTransactions.push({
        description: 'Bistro & Coffee Shops',
        amount: 65.50,
        type: 'expense',
        category_id: catMap['Dining & Entertainment'],
        date: `${yearMonth}-09`,
        payment_method: 'Debit Card',
        notes: 'Dinner with friends'
      });
      sampleTransactions.push({
        description: 'Sushi Restaurant Night',
        amount: 88.00,
        type: 'expense',
        category_id: catMap['Dining & Entertainment'],
        date: `${yearMonth}-22`,
        payment_method: 'Credit Card',
        notes: 'Weekend dining'
      });

      // Utilities
      sampleTransactions.push({
        description: 'Power & Electric Utility',
        amount: 110.25,
        type: 'expense',
        category_id: catMap['Utilities & Bills'],
        date: `${yearMonth}-12`,
        payment_method: 'Auto-Debit',
        notes: 'Monthly power bill'
      });

      // Transportation
      sampleTransactions.push({
        description: 'Gas Station Fuel',
        amount: 52.00,
        type: 'expense',
        category_id: catMap['Transportation & Fuel'],
        date: `${yearMonth}-10`,
        payment_method: 'Credit Card',
        notes: 'Fuel fill up'
      });

      // Subscriptions
      sampleTransactions.push({
        description: 'Cloud Software & Netflix',
        amount: 34.99,
        type: 'expense',
        category_id: catMap['Subscriptions & Software'],
        date: `${yearMonth}-15`,
        payment_method: 'Credit Card',
        notes: 'Digital subscriptions'
      });
    }

    for (const t of sampleTransactions) {
      await this.addTransaction(t);
    }

    console.log(`Seeded ${sampleTransactions.length} sample transactions.`);
    return { success: true, count: sampleTransactions.length };
  }
}

module.exports = new DBService();
