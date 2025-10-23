import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class StartPutawayTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('wizardPage').getByRole('grid');
  }

  get rows() {
    return this.table.getByRole('rowgroup');
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

  get editButton() {
    return this.row.getByTestId('edit-button');
  }

  get splitLineButton() {
    return this.row.getByRole('button', { name: 'Split line' });
  }

  get deleteButton() {
    return this.row.getByTestId('delete-button');
  }

  getItem(name: string) {
    return this.row.getByTestId('label-field').getByText(name);
  }

  get putawayBinSelect() {
    return this.row.getByTestId('select-bin');
  }

  getPutawayBin(putawayBin: string) {
    return this.page
      .getByTestId('custom-select-dropdown-menu')
      .getByRole('listitem')
      .getByText(putawayBin, { exact: true });
  }
}

export default StartPutawayTable;
