const dbService = require('../services/dbService');

exports.getSummary = async (req, res) => {
  try {
    const summary = await dbService.getSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to retrieve summary metrics' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const analytics = await dbService.getAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics breakdown' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await dbService.getCategories();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

exports.seedData = async (req, res) => {
  try {
    const result = await dbService.seedData();
    res.json({ message: 'Sample financial dataset seeded successfully', ...result });
  } catch (err) {
    console.error('Error seeding data:', err);
    res.status(500).json({ error: 'Failed to seed sample data' });
  }
};
