import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class TransactionDetailsHeaderTab extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get section() {
    return this.page.locator('#transaction-header');
  }

  get table() {
    return this.section.getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

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

  get transactionDateMinuteSelect() {
    return this.row.locator('select[name="transactionDate_minute"]');
  }

  async decreaseMinute() {
    const selectedValue = await this.transactionDateMinuteSelect.inputValue();
    const parsedValue = parseInt(selectedValue || '0', 10);
    const nextMinute = (parsedValue - 1 + 60) % 60;
    const optionToSelect = String(nextMinute).padStart(2, '0');
    await this.transactionDateMinuteSelect.selectOption(optionToSelect);
  }
}

export default TransactionDetailsHeaderTab;
