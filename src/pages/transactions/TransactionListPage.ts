import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import TransactionTable from './components/TransactionTable';

class TransactionListPage extends BasePageModel {
  table: TransactionTable;
  constructor(page: Page) {
    super(page);
    this.table = new TransactionTable(page);
  }

  get successMessage() {
    return this.page.locator('.message');
  }

  async deleteTransaction(n: number) {
    await this.table.row(n).actionsButton.click();
    await this.table.deleteButton.click();
    await expect(this.page.locator('.message')).toBeVisible();
  }

  /**
   * Best-effort deletion used during cleanup. After a test fails mid-way the
   * expected transactions may be missing, so a hard delete would throw and
   * abort the afterEach before the shipment gets removed — leaving a received
   * shipment behind. This swallows such errors so cleanup can continue.
   */
  async deleteTransactionIfPresent(n: number) {
    try {
      await this.deleteTransaction(n);
    } catch {
      // Nothing to delete at this row; continue with the rest of the cleanup.
    }
  }
}

export default TransactionListPage;
