// Smart Analytics & Financial Insights Component
const AnalyticsModule = {
  async loadAnalytics() {
    try {
      const data = await API.getAnalytics();

      // 1. Render Smart Insights Cards
      const container = document.getElementById('insights-container');
      if (container) {
        if (!data.insights || data.insights.length === 0) {
          container.innerHTML = `<div class="card glass" style="grid-column: 1 / -1;"><p class="text-muted text-center">Add more transactions to generate financial insights.</p></div>`;
        } else {
          container.innerHTML = data.insights.map(item => {
            let iconClass = 'fa-circle-info';
            if (item.type === 'warning') iconClass = 'fa-triangle-exclamation';
            if (item.type === 'success') iconClass = 'fa-circle-check';
            if (item.type === 'danger') iconClass = 'fa-circle-xmark';

            return `
              <div class="insight-card glass ${item.type}">
                <div class="insight-icon">
                  <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="insight-content">
                  <h4>${item.title}</h4>
                  <p>${item.text}</p>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // 2. Render Payment Method Chart
      if (data.paymentMethods && data.paymentMethods.length > 0) {
        Charts.initPaymentMethodChart('chart-payment-methods', data.paymentMethods);
      }

      // 3. Render Category Statistics Table
      const statsTbody = document.getElementById('category-stats-tbody');
      if (statsTbody && data.categoryBreakdown) {
        statsTbody.innerHTML = data.categoryBreakdown.map(cat => `
          <tr>
            <td>
              <span class="badge" style="background: ${cat.color}25; color: ${cat.color}; padding: 4px 8px; border-radius: 6px; font-weight: 600;">
                ${cat.category}
              </span>
            </td>
            <td><span class="text-muted font-mono">${cat.count} txs</span></td>
            <td class="text-right font-mono text-danger font-bold">$${cat.amount.toFixed(2)}</td>
          </tr>
        `).join('');
      }

    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }
};

window.AnalyticsModule = AnalyticsModule;
