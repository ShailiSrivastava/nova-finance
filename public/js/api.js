// Nova Finance API Client Wrapper
const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // Summary & Analytics
  getSummary() {
    return this.request('/summary');
  },
  getAnalytics() {
    return this.request('/analytics');
  },
  getCategories() {
    return this.request('/categories');
  },

  // Transactions
  getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions?${query}`);
  },
  addTransaction(data) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateTransaction(id, data) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE'
    });
  },
  getExportCsvUrl(params = {}) {
    const query = new URLSearchParams(params).toString();
    return `${this.baseUrl}/transactions/export/csv?${query}`;
  },

  // Budgets
  getBudgets() {
    return this.request('/budgets');
  },
  setBudget(data) {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  deleteBudget(id) {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE'
    });
  },

  // Recurring Transactions
  getRecurring() {
    return this.request('/recurring');
  },
  addRecurring(data) {
    return this.request('/recurring', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  deleteRecurring(id) {
    return this.request(`/recurring/${id}`, {
      method: 'DELETE'
    });
  },
  processRecurringDue() {
    return this.request('/recurring/process', {
      method: 'POST'
    });
  },

  // Seed Data
  seedData() {
    return this.request('/seed', {
      method: 'POST'
    });
  }
};

window.API = API;
