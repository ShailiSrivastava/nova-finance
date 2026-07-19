const dbService = require('./dbService');
const { dbRun, dbAll } = require('../config/database');

class RecurringEngine {
  // Calculate next due date based on frequency
  calculateNextDate(currentDateStr, frequency) {
    const d = new Date(currentDateStr);
    switch (frequency) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().slice(0, 10);
  }

  // Process due recurring transactions
  async processDue() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const sql = `
      SELECT r.* FROM recurring_transactions r
      WHERE r.next_due_date <= ? AND r.auto_process = 1
    `;
    const dueItems = await dbAll(sql, [todayStr]);
    let processedCount = 0;

    for (const item of dueItems) {
      // 1. Create actual transaction record
      await dbService.addTransaction({
        description: `[Auto] ${item.description}`,
        amount: item.amount,
        type: item.type,
        category_id: item.category_id,
        date: item.next_due_date,
        payment_method: item.payment_method || 'Auto-Debit',
        notes: `Automatically generated recurring transaction (${item.frequency})`
      });

      // 2. Advance next due date
      const nextDate = this.calculateNextDate(item.next_due_date, item.frequency);
      await dbRun(
        `UPDATE recurring_transactions SET next_due_date = ?, last_processed_date = ? WHERE id = ?`,
        [nextDate, todayStr, item.id]
      );

      processedCount++;
    }

    if (processedCount > 0) {
      console.log(`[RecurringEngine] Processed ${processedCount} pending recurring transactions.`);
    }
    return processedCount;
  }
}

module.exports = new RecurringEngine();
