// Nova Finance Core SPA Application Controller
const app = {
  categories: [],

  async init() {
    console.log('⚡ Initializing Nova Finance Application...');
    this.bindEvents();
    await this.loadCategories();

    // Initialize module controllers
    TransactionsModule.init();
    BudgetsModule.init();
    RecurringModule.init();

    // Load initial data
    await this.refreshAll();
  },

  bindEvents() {
    // Navigation Tabs
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = btn.dataset.close;
        this.closeModal(modalId);
      });
    });

    // Outer Overlay Modal Close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal(overlay.id);
        }
      });
    });

    // Add Transaction Button
    document.getElementById('btn-add-tx')?.addEventListener('click', () => {
      TransactionsModule.openAddModal();
    });

    // Reset Seed Data Button
    document.getElementById('btn-seed-data')?.addEventListener('click', async () => {
      if (!confirm('Reset database with fresh sample financial dataset?')) return;
      try {
        await API.seedData();
        this.showToast('Demo dataset reset successfully', 'success');
        await this.refreshAll();
      } catch (err) {
        this.showToast('Failed to reset dataset', 'error');
      }
    });
  },

  async loadCategories() {
    try {
      this.categories = await API.getCategories();
      this.populateCategoryDropdowns();
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  populateCategoryDropdowns() {
    const filterSelect = document.getElementById('tx-filter-category');
    const txSelect = document.getElementById('tx-category');
    const budgetSelect = document.getElementById('budget-category');
    const recSelect = document.getElementById('rec-category');

    const optionsHtml = this.categories.map(c => `
      <option value="${c.id}">${c.name} (${c.type})</option>
    `).join('');

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">All Categories</option>` + optionsHtml;
    }
    if (txSelect) txSelect.innerHTML = optionsHtml;
    if (budgetSelect) budgetSelect.innerHTML = optionsHtml;
    if (recSelect) recSelect.innerHTML = optionsHtml;
  },

  switchTab(tabName) {
    // Nav highlight
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });

    // Page Title Update
    const titles = {
      dashboard: { title: 'Dashboard Overview', subtitle: 'Real-time financial performance and metrics' },
      transactions: { title: 'Transactions Manager', subtitle: 'Search, filter, edit and export financial logs' },
      budgets: { title: 'Budgets & Goals', subtitle: 'Monthly spending limits and utilization alerts' },
      recurring: { title: 'Recurring Bills & Subscriptions', subtitle: 'Automate recurring salary income and bill payments' },
      analytics: { title: 'Smart Financial Analytics', subtitle: 'Intelligent spend analysis and cashflow insights' }
    };

    if (titles[tabName]) {
      document.getElementById('page-title').innerText = titles[tabName].title;
      document.getElementById('page-subtitle').innerText = titles[tabName].subtitle;
    }

    // Lazy load tab data
    if (tabName === 'transactions') TransactionsModule.loadTransactions();
    if (tabName === 'budgets') BudgetsModule.loadBudgets();
    if (tabName === 'recurring') RecurringModule.loadRecurring();
    if (tabName === 'analytics') AnalyticsModule.loadAnalytics();
  },

  async refreshAll() {
    await Promise.all([
      this.loadSummaryKPIs(),
      TransactionsModule.loadRecentTransactions(),
      this.loadDashboardCharts(),
      BudgetsModule.loadBudgets(),
      RecurringModule.loadRecurring(),
      AnalyticsModule.loadAnalytics()
    ]);
  },

  async loadSummaryKPIs() {
    try {
      const summary = await API.getSummary();
      
      const netEl = document.getElementById('kpi-net-balance');
      const incEl = document.getElementById('kpi-total-income');
      const expEl = document.getElementById('kpi-total-expense');
      const savEl = document.getElementById('kpi-savings-rate');

      if (netEl) netEl.innerText = `$${summary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (incEl) incEl.innerText = `$${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (expEl) expEl.innerText = `$${summary.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (savEl) savEl.innerText = `${summary.savingsRate}%`;

      if (summary.totalBalance < 0 && netEl) {
        netEl.classList.remove('text-success');
        netEl.classList.add('text-danger');
      } else if (netEl) {
        netEl.classList.remove('text-danger');
        netEl.classList.add('text-success');
      }
    } catch (err) {
      console.error('Failed to load summary KPIs:', err);
    }
  },

  async loadDashboardCharts() {
    try {
      const analytics = await API.getAnalytics();
      if (analytics.monthlyTrend) {
        Charts.initCashFlowChart('chart-cashflow', analytics.monthlyTrend);
      }
      if (analytics.categoryBreakdown) {
        Charts.initCategoryChart('chart-categories', analytics.categoryBreakdown);
      }
    } catch (err) {
      console.error('Failed to load dashboard charts:', err);
    }
  },

  openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
  },

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
