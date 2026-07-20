// Chart.js Manager for Nova Finance Dashboard - Bold Colors Theme
const Charts = {
  instances: {},

  initCashFlowChart(canvasId, monthlyTrend) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const labels = monthlyTrend.map(item => item.month);
    const incomeData = monthlyTrend.map(item => item.income);
    const expenseData = monthlyTrend.map(item => item.expense);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income ($)',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Expenses ($)',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12, weight: '600' } }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#64748b' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            ticks: { 
              color: '#64748b',
              callback: (val) => `$${val}`
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    });
  },

  initCategoryChart(canvasId, categoryBreakdown) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const labels = categoryBreakdown.map(item => item.category);
    const data = categoryBreakdown.map(item => item.amount);
    const colors = categoryBreakdown.map(item => item.color || '#6366f1');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#0f172a'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.label}: $${context.parsed.toLocaleString()}`
            }
          }
        },
        cutout: '70%'
      }
    });
  },

  initPaymentMethodChart(canvasId, paymentMethods) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const labels = paymentMethods.map(item => item.method);
    const data = paymentMethods.map(item => item.total);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              '#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#a855f7'
            ],
            borderWidth: 2,
            borderColor: '#0f172a'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        }
      }
    });
  }
};

window.Charts = Charts;
