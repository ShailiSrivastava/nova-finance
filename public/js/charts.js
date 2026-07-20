// Chart.js Manager for Nova Finance Dashboard - True Bold Colors Theme
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
            backgroundColor: '#00e676',
            borderColor: '#00c853',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Expenses ($)',
            data: expenseData,
            backgroundColor: '#ff1744',
            borderColor: '#d50000',
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
            labels: { color: '#ffffff', font: { family: 'Inter', size: 12, weight: '700' } }
          },
          tooltip: {
            backgroundColor: '#0e121b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3d5af1',
            borderWidth: 1.5,
            callbacks: {
              label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { weight: '600' } },
            grid: { color: 'rgba(255, 255, 255, 0.06)' }
          },
          y: {
            ticks: { 
              color: '#94a3b8',
              font: { weight: '600' },
              callback: (val) => `$${val}`
            },
            grid: { color: 'rgba(255, 255, 255, 0.06)' }
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
    
    // Bold vivid color palette
    const boldPalette = ['#3d5af1', '#00e676', '#ffab00', '#00e5ff', '#ff1744', '#d500f9', '#7c4dff', '#ff6d00'];
    const colors = categoryBreakdown.map((item, i) => item.color || boldPalette[i % boldPalette.length]);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#141926'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ffffff', font: { family: 'Inter', size: 11, weight: '600' }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#0e121b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3d5af1',
            borderWidth: 1.5,
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
              '#3d5af1', '#00e676', '#ffab00', '#00e5ff', '#d500f9', '#ff1744'
            ],
            borderWidth: 2,
            borderColor: '#141926'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ffffff', font: { family: 'Inter', size: 11, weight: '600' } }
          },
          tooltip: {
            backgroundColor: '#0e121b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3d5af1',
            borderWidth: 1.5
          }
        }
      }
    });
  }
};

window.Charts = Charts;
