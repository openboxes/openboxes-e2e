import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class PutawayListTable extends BasePageModel {
  get table() {
    return this.page.getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  get viewOrderDetailsButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'View order details' });
  }

  get deleteOrderButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'Delete Order' });
  }

  async clickDeleteOrderButton() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteOrderButton.click();
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get actionsButton() {
    return this.row.getByTestId('action-menu-0');
  }

  get statusTag() {
    return this.row.getByTestId('status-0');
  }

  get orderNumber() {
    return this.row.getByTestId('order-number-0');
  }
}
export default PutawayListTable;
