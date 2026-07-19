const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController');
const budgetController = require('../controllers/budgetController');
const recurringController = require('../controllers/recurringController');
const analyticsController = require('../controllers/analyticsController');

const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// --- Summary & Analytics Endpoints (Optimized with In-Memory Caching) ---
router.get('/summary', cacheMiddleware(30), analyticsController.getSummary);
router.get('/analytics', cacheMiddleware(30), analyticsController.getAnalytics);
router.get('/categories', cacheMiddleware(300), analyticsController.getCategories);

// --- Transactions REST APIs ---
router.get('/transactions', transactionController.getTransactions);
router.post('/transactions', transactionController.addTransaction);
router.put('/transactions/:id', transactionController.updateTransaction);
router.delete('/transactions/:id', transactionController.deleteTransaction);
router.get('/transactions/export/csv', transactionController.exportCSV);

// --- Budgets REST APIs ---
router.get('/budgets', budgetController.getBudgets);
router.post('/budgets', budgetController.setBudget);
router.delete('/budgets/:id', budgetController.deleteBudget);

// --- Recurring Transactions REST APIs ---
router.get('/recurring', recurringController.getRecurringTransactions);
router.post('/recurring', recurringController.addRecurringTransaction);
router.delete('/recurring/:id', recurringController.deleteRecurringTransaction);
router.post('/recurring/process', recurringController.processDueNow);

// --- Utility Seed Endpoint ---
router.post('/seed', analyticsController.seedData);

module.exports = router;
