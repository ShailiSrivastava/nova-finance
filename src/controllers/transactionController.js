const dbService = require('../services/dbService');
const { clearCache } = require('../middleware/cacheMiddleware');

exports.getTransactions = async (req, res) => {
  try {
    const { search, categoryId, type, startDate, endDate, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const filterObj = {
      search,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      type,
      startDate,
      endDate
    };

    const transactions = await dbService.getTransactions({ ...filterObj, limit: limitNum, offset });
    const totalCount = await dbService.countTransactions(filterObj);

    res.json({
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const { description, amount, type, category_id, date, payment_method, notes } = req.body;
    if (!description || !amount || !type || !category_id || !date) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    const newTx = await dbService.addTransaction({
      description,
      amount: parseFloat(amount),
      type,
      category_id: parseInt(category_id, 10),
      date,
      payment_method,
      notes
    });

    clearCache(); // Invalidate response cache
    res.status(201).json(newTx);
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, type, category_id, date, payment_method, notes } = req.body;

    const updatedTx = await dbService.updateTransaction(id, {
      description,
      amount: parseFloat(amount),
      type,
      category_id: parseInt(category_id, 10),
      date,
      payment_method,
      notes
    });

    clearCache();
    res.json(updatedTx);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteTransaction(id);
    clearCache();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const { search, categoryId, type, startDate, endDate } = req.query;
    const filterObj = {
      search,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      type,
      startDate,
      endDate,
      limit: 5000, // Export up to 5000 records
      offset: 0
    };

    const transactions = await dbService.getTransactions(filterObj);

    // Build CSV Content
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount ($)', 'Payment Method', 'Notes'];
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const formatted = String(str).replace(/"/g, '""');
      return `"${formatted}"`;
    };

    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type.toUpperCase(),
      escapeCsv(t.category_name),
      escapeCsv(t.description),
      t.amount.toFixed(2),
      escapeCsv(t.payment_method),
      escapeCsv(t.notes || '')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="nova_finance_export.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};
