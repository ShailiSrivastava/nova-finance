// Recurring Transactions & Bills Component
const RecurringModule = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('btn-add-recurring')?.addEventListener('click', () => {
      this.openRecurringModal();
    });

    document.getElementById('btn-run-recurring-now')?.addEventListener('click', () => {
      this.runDueNow();
    });

    document.getElementById('form-recurring')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveRecurring();
    });
  },

  async loadRecurring() {
    try {
      const list = await API.getRecurring();
      const tbody = document.getElementById('recurring-tbody');
      if (!tbody) return;

      if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No recurring rules configured.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(r => `
        <tr>
          <td><strong>${r.description}</strong></td>
          <td>
            <span class="badge" style="background: #18181b; color: #ffffff; border: 1px solid #27272a; padding: 4px 8px; border-radius: 6px; font-weight: 600;">
              ${r.category_name}
            </span>
          </td>
          <td><span class="badge" style="text-transform: capitalize; background: rgba(255,255,255,0.06);">${r.frequency}</span></td>
          <td><span class="text-muted">${r.payment_method}</span></td>
          <td class="font-mono">${r.next_due_date}</td>
          <td>
            <span class="badge ${r.auto_process ? 'text-success' : 'text-muted'}" style="background: rgba(255,255,255,0.05);">
              ${r.auto_process ? 'Enabled' : 'Manual'}
            </span>
          </td>
          <td class="text-right font-mono ${r.type === 'income' ? 'text-success' : 'text-danger'}" style="font-weight: 700;">
            ${r.type === 'income' ? '+' : '-'}$${r.amount.toFixed(2)}
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-danger" onclick="RecurringModule.deleteRecurring(${r.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Failed to load recurring list:', err);
    }
  },

  openRecurringModal() {
    document.getElementById('form-recurring').reset();
    document.getElementById('rec-next-date').value = new Date().toISOString().slice(0, 10);
    app.openModal('modal-recurring');
  },

  async saveRecurring() {
    const data = {
      description: document.getElementById('rec-description').value,
      amount: parseFloat(document.getElementById('rec-amount').value),
      type: document.getElementById('rec-type').value,
      category_id: parseInt(document.getElementById('rec-category').value, 10),
      frequency: document.getElementById('rec-frequency').value,
      next_due_date: document.getElementById('rec-next-date').value,
      payment_method: document.getElementById('rec-payment-method').value,
      auto_process: 1
    };

    try {
      await API.addRecurring(data);
      app.showToast('Recurring transaction rule created', 'success');
      app.closeModal('modal-recurring');
      app.refreshAll();
    } catch (err) {
      app.showToast('Failed to create recurring rule', 'error');
    }
  },

  async deleteRecurring(id) {
    if (!confirm('Delete this recurring subscription rule?')) return;
    try {
      await API.deleteRecurring(id);
      app.showToast('Recurring rule deleted', 'success');
      app.refreshAll();
    } catch (err) {
      app.showToast('Error deleting recurring rule', 'error');
    }
  },

  async runDueNow() {
    try {
      const res = await API.processRecurringDue();
      app.showToast(res.message, 'success');
      app.refreshAll();
    } catch (err) {
      app.showToast('Failed to run recurring execution', 'error');
    }
  }
};

window.RecurringModule = RecurringModule;
