import { Locator, Page } from '@playwright/test';

import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class ReceivingTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('items-table');
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
  receivingNowField: TextField;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.receivingNowField = new TextField(page, 'Receiving now', row);
  }

  get deleteButton() {
    return this.row.getByRole('button', { name: 'Delete' });
  }
}

export default ReceivingTable;
