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

  async getDeleteTransaction(n: number) {
    await this.table.row(n).actionsButton.click();
    await this.table.deleteButton.click();
    await expect(this.page.locator('.message')).toBeVisible();
  }
}

export default TransactionListPage;
