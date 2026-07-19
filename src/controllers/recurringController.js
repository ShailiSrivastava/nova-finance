const dbService = require('../services/dbService');
const recurringEngine = require('../services/recurringEngine');
const { clearCache } = require('../middleware/cacheMiddleware');

exports.getRecurringTransactions = async (req, res) => {
  try {
    const list = await dbService.getRecurringTransactions();
    res.json(list);
  } catch (err) {
    console.error('Error fetching recurring transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve recurring transactions' });
  }
};

exports.addRecurringTransaction = async (req, res) => {
  try {
    const { description, amount, type, category_id, frequency, next_due_date, payment_method, auto_process } = req.body;
    if (!description || !amount || !type || !category_id || !frequency || !next_due_date) {
      return res.status(400).json({ error: 'Missing required recurring transaction fields' });
    }

    const newRec = await dbService.addRecurringTransaction({
      description,
      amount: parseFloat(amount),
      type,
      category_id: parseInt(category_id, 10),
      frequency,
      next_due_date,
      payment_method,
      auto_process: auto_process !== undefined ? parseInt(auto_process, 10) : 1
    });

    clearCache();
    res.status(201).json(newRec);
  } catch (err) {
    console.error('Error adding recurring transaction:', err);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
};

exports.deleteRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteRecurringTransaction(id);
    clearCache();
    res.json({ message: 'Recurring transaction deleted' });
  } catch (err) {
    console.error('Error deleting recurring transaction:', err);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
};

exports.processDueNow = async (req, res) => {
  try {
    const count = await recurringEngine.processDue();
    if (count > 0) clearCache();
    res.json({ message: `Processed ${count} due transactions.`, processedCount: count });
  } catch (err) {
    console.error('Error running recurring engine:', err);
    res.status(500).json({ error: 'Failed to process recurring transactions' });
  }
};
