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
}
export default PutawayListTable;
