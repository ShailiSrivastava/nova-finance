// Transactions Manager Component
const TransactionsModule = {
  currentPage: 1,
  limit: 15,
  totalPages: 1,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Filter & search triggers
    document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
      this.currentPage = 1;
      this.loadTransactions();
    });

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      document.getElementById('tx-search').value = '';
      document.getElementById('tx-filter-type').value = '';
      document.getElementById('tx-filter-category').value = '';
      document.getElementById('tx-filter-start-date').value = '';
      document.getElementById('tx-filter-end-date').value = '';
      this.currentPage = 1;
      this.loadTransactions();
    });

    // Pagination buttons
    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadTransactions();
      }
    });

    document.getElementById('btn-next-page')?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadTransactions();
      }
    });

    // Transaction form submission
    document.getElementById('form-transaction')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTransaction();
    });

    // CSV Export button trigger
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      this.exportCSV();
    });
  },

  getFilterParams() {
    return {
      search: document.getElementById('tx-search')?.value.trim() || '',
      type: document.getElementById('tx-filter-type')?.value || '',
      categoryId: document.getElementById('tx-filter-category')?.value || '',
      startDate: document.getElementById('tx-filter-start-date')?.value || '',
      endDate: document.getElementById('tx-filter-end-date')?.value || '',
      page: this.currentPage,
      limit: this.limit
    };
  },

  async loadRecentTransactions() {
    try {
      const res = await API.getTransactions({ limit: 5, page: 1 });
      const tbody = document.getElementById('recent-transactions-tbody');
      if (!tbody) return;

      if (!res.data || res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No transactions found.</td></tr>`;
        return;
      }

      tbody.innerHTML = res.data.map(t => `
        <tr>
          <td class="font-mono">${t.date}</td>
          <td>
            <span class="badge" style="background: ${t.category_color}25; color: ${t.category_color}; padding: 4px 8px; border-radius: 6px; font-weight: 600;">
              ${t.category_name}
            </span>
          </td>
          <td><strong>${t.description}</strong></td>
          <td><span class="text-muted">${t.payment_method}</span></td>
          <td>
            <span class="badge ${t.type === 'income' ? 'text-success' : 'text-danger'}" style="text-transform: uppercase; font-size: 0.75rem; font-weight: 700;">
              ${t.type}
            </span>
          </td>
          <td class="text-right font-mono ${t.type === 'income' ? 'text-success' : 'text-danger'}" style="font-weight: 700;">
            ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Failed to load recent transactions:', err);
    }
  },

  async loadTransactions() {
    try {
      const params = this.getFilterParams();
      const res = await API.getTransactions(params);
      const tbody = document.getElementById('all-transactions-tbody');
      if (!tbody) return;

      this.totalPages = res.pagination.totalPages || 1;

      if (!res.data || res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No transactions matching criteria.</td></tr>`;
      } else {
        tbody.innerHTML = res.data.map(t => `
          <tr>
            <td class="font-mono">${t.date}</td>
            <td>
              <span class="badge" style="background: ${t.category_color || '#3d5af1'}; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: 700; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                ${t.category_name}
              </span>
            </td>
            <td><strong>${t.description}</strong></td>
            <td><span class="text-muted">${t.payment_method}</span></td>
            <td><span class="text-muted text-sm">${t.notes || '-'}</span></td>
            <td class="text-right font-mono ${t.type === 'income' ? 'text-success' : 'text-danger'}" style="font-weight: 700;">
              ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
            </td>
            <td class="text-center">
              <button class="btn btn-sm btn-secondary" onclick="TransactionsModule.openEditModal(${t.id})">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="TransactionsModule.deleteTransaction(${t.id})">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('');
      }

      // Update Pagination UI
      const pageDisplay = document.getElementById('page-num-display');
      const pageInfo = document.getElementById('pagination-info');
      const btnPrev = document.getElementById('btn-prev-page');
      const btnNext = document.getElementById('btn-next-page');

      if (pageDisplay) pageDisplay.innerText = `Page ${this.currentPage} of ${this.totalPages || 1}`;
      if (pageInfo) pageInfo.innerText = `Showing ${res.data.length} of ${res.pagination.totalCount} transactions`;

      if (btnPrev) btnPrev.disabled = (this.currentPage <= 1);
      if (btnNext) btnNext.disabled = (this.currentPage >= this.totalPages);

    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  },

  openAddModal() {
    document.getElementById('modal-tx-title').innerText = 'Add New Transaction';
    document.getElementById('tx-id').value = '';
    document.getElementById('form-transaction').reset();
    document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);
    app.openModal('modal-transaction');
  },

  async openEditModal(id) {
    try {
      const res = await API.getTransactions({ limit: 1000 });
      const tx = res.data.find(item => item.id === id);
      if (!tx) return;

      document.getElementById('modal-tx-title').innerText = 'Edit Transaction';
      document.getElementById('tx-id').value = tx.id;
      document.getElementById('tx-description').value = tx.description;
      document.getElementById('tx-amount').value = tx.amount;
      document.getElementById('tx-type').value = tx.type;
      document.getElementById('tx-category').value = tx.category_id;
      document.getElementById('tx-date').value = tx.date;
      document.getElementById('tx-payment-method').value = tx.payment_method;
      document.getElementById('tx-notes').value = tx.notes || '';

      app.openModal('modal-transaction');
    } catch (err) {
      app.showToast('Failed to load transaction details', 'error');
    }
  },

  async saveTransaction() {
    const id = document.getElementById('tx-id').value;
    const data = {
      description: document.getElementById('tx-description').value,
      amount: parseFloat(document.getElementById('tx-amount').value),
      type: document.getElementById('tx-type').value,
      category_id: parseInt(document.getElementById('tx-category').value, 10),
      date: document.getElementById('tx-date').value,
      payment_method: document.getElementById('tx-payment-method').value,
      notes: document.getElementById('tx-notes').value
    };

    try {
      if (id) {
        await API.updateTransaction(id, data);
        app.showToast('Transaction updated successfully', 'success');
      } else {
        await API.addTransaction(data);
        app.showToast('Transaction created successfully', 'success');
      }

      app.closeModal('modal-transaction');
      app.refreshAll();
    } catch (err) {
      app.showToast(err.message || 'Error saving transaction', 'error');
    }
  },

  async deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await API.deleteTransaction(id);
      app.showToast('Transaction deleted', 'success');
      app.refreshAll();
    } catch (err) {
      app.showToast('Error deleting transaction', 'error');
    }
  },

  exportCSV() {
    const params = this.getFilterParams();
    delete params.page;
    delete params.limit;
    const url = API.getExportCsvUrl(params);
    window.open(url, '_blank');
    app.showToast('Downloading CSV export...', 'info');
  }
};

window.TransactionsModule = TransactionsModule;
