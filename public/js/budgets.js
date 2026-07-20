// Budgets & Goals Component
const BudgetsModule = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('btn-add-budget')?.addEventListener('click', () => {
      this.openBudgetModal();
    });

    document.getElementById('form-budget')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBudget();
    });
  },

  async loadBudgets() {
    try {
      const budgets = await API.getBudgets();
      const grid = document.getElementById('budgets-grid');
      if (!grid) return;

      if (!budgets || budgets.length === 0) {
        grid.innerHTML = `
          <div class="card glass text-center" style="grid-column: 1 / -1; padding: 3rem;">
            <i class="fa-solid fa-wallet" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h3>No Monthly Budgets Set</h3>
            <p class="text-muted">Click 'Set Budget Limit' above to create category spending controls.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = budgets.map(b => {
        const percent = b.monthly_limit > 0 ? Math.min(100, Math.round((b.current_spent / b.monthly_limit) * 100)) : 0;
        const rawPercent = b.monthly_limit > 0 ? ((b.current_spent / b.monthly_limit) * 100).toFixed(1) : 0;
        const isOver = b.current_spent > b.monthly_limit;
        const isWarning = rawPercent >= 80 && !isOver;

        let barColor = '#ffffff';
        if (isWarning) barColor = '#d4d4d8';
        if (isOver) barColor = '#a1a1aa';

        return `
          <div class="budget-card glass ${isOver ? 'over-limit' : ''}">
            <div class="budget-header">
              <div class="budget-category-info">
                <div class="category-badge-icon">
                  <i class="fa-solid fa-layer-group"></i>
                </div>
                  <i class="fa-solid fa-layer-group"></i>
                </div>
                <div>
                  <h4>${b.category_name}</h4>
                  <span class="text-muted text-sm">${rawPercent}% Used</span>
                </div>
              </div>
              <button class="btn btn-sm btn-outline-secondary" onclick="BudgetsModule.deleteBudget(${b.id})">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>

            <div class="budget-amounts">
              <span>Spent: <strong>$${b.current_spent.toFixed(2)}</strong></span>
              <span>Limit: <strong>$${b.monthly_limit.toFixed(2)}</strong></span>
            </div>

            <div class="progress-track">
              <div class="progress-bar" style="width: ${percent}%; background: ${barColor};"></div>
            </div>

            <div class="text-right">
              ${isOver 
                ? `<span class="badge text-danger font-mono" style="font-size: 0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> Over budget by $${(b.current_spent - b.monthly_limit).toFixed(2)}</span>`
                : `<span class="text-muted font-mono" style="font-size: 0.75rem;">$${(b.monthly_limit - b.current_spent).toFixed(2)} remaining</span>`
              }
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load budgets:', err);
    }
  },

  openBudgetModal() {
    document.getElementById('form-budget').reset();
    app.openModal('modal-budget');
  },

  async saveBudget() {
    const data = {
      category_id: parseInt(document.getElementById('budget-category').value, 10),
      monthly_limit: parseFloat(document.getElementById('budget-limit').value)
    };

    try {
      await API.setBudget(data);
      app.showToast('Budget limit saved', 'success');
      app.closeModal('modal-budget');
      app.refreshAll();
    } catch (err) {
      app.showToast('Failed to save budget', 'error');
    }
  },

  async deleteBudget(id) {
    if (!confirm('Remove budget limit for this category?')) return;
    try {
      await API.deleteBudget(id);
      app.showToast('Budget removed', 'success');
      app.refreshAll();
    } catch (err) {
      app.showToast('Failed to remove budget', 'error');
    }
  }
};

window.BudgetsModule = BudgetsModule;
