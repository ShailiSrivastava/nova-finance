// Chart.js Manager for Nova Finance Dashboard - Monochrome Theme
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
            backgroundColor: '#ffffff',
            borderColor: '#ffffff',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Expenses ($)',
            data: expenseData,
            backgroundColor: '#3f3f46',
            borderColor: '#52525b',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#a1a1aa', font: { family: 'Inter', size: 12, weight: '600' } }
          },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3f3f46',
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#71717a' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            ticks: { 
              color: '#71717a',
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

    const monoPalette = ['#ffffff', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];
    const colors = categoryBreakdown.map((_, i) => monoPalette[i % monoPalette.length]);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#121215'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#a1a1aa', font: { family: 'Inter', size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3f3f46',
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.label}: $${context.parsed.toLocaleString()}`
            }
          }
        },
        cutout: '72%'
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
    const monoPalette = ['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];

    this.instances[canvasId] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: monoPalette.slice(0, data.length),
            borderWidth: 2,
            borderColor: '#121215'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#a1a1aa', font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3f3f46',
            borderWidth: 1
          }
        }
      }
    });
  }
};

window.Charts = Charts;
