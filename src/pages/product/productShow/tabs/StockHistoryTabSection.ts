import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class StockHistoryTabSection extends BasePageModel {
  async isLoaded() {
    await expect(this.table).toBeVisible();
  }

  get table() {
    return this.page.locator('#stockHistoryTable');
  }

  // .dataRow excludes the year/month separator rows that share the same tbody
  get rows() {
    return this.table.locator('.dataRow');
  }

  // rows are ordered oldest-first, so the most recently added transactions
  // are the last rows, not the first
  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get transactionTypeIcon() {
    return this.row.locator('td').nth(0).locator('img');
  }

  get date() {
    return this.row.locator('td').nth(1);
  }

  get time() {
    return this.row.locator('td').nth(2);
  }

  get createdBy() {
    return this.row.locator('td').nth(3);
  }

  get transactionLink() {
    return this.row.locator('td').nth(4).getByRole('link');
  }

  get binLocation() {
    return this.row.locator('td').nth(8);
  }

  get lotNumber() {
    return this.row.locator('td').nth(9);
  }

  get count() {
    return this.row.locator('td').nth(10);
  }

  get credit() {
    return this.row.locator('td').nth(11).locator('.credit');
  }

  get debit() {
    return this.row.locator('td').nth(12).locator('.debit');
  }

  get balance() {
    return this.row.locator('td').nth(13);
  }
}

export default StockHistoryTabSection;
