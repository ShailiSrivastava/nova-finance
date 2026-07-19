const dbService = require('../services/dbService');
const { clearCache } = require('../middleware/cacheMiddleware');

exports.getBudgets = async (req, res) => {
  try {
    const budgets = await dbService.getBudgets();
    res.json(budgets);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Failed to retrieve budgets' });
  }
};

exports.setBudget = async (req, res) => {
  try {
    const { category_id, monthly_limit } = req.body;
    if (!category_id || !monthly_limit) {
      return res.status(400).json({ error: 'Category ID and Monthly Limit are required' });
    }

    const budget = await dbService.setBudget({
      category_id: parseInt(category_id, 10),
      monthly_limit: parseFloat(monthly_limit)
    });

    clearCache();
    res.json(budget);
  } catch (err) {
    console.error('Error setting budget:', err);
    res.status(500).json({ error: 'Failed to save budget limit' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteBudget(id);
    clearCache();
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};
