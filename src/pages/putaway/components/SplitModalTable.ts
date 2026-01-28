import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class SplitModalTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('table');
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

  get deleteButton() {
    return this.row.getByTestId('delete-button');
  }

  async getPutawayBin(putawayBin: string) {
    await this.row
      .getByTestId('bin-select')
      .getByRole('textbox')
      .fill(putawayBin);
    await this.page
      .getByTestId('custom-select-dropdown-menu')
      .locator('.react-select__option')
      .nth(0)
      .click();
  }

  get quantityField() {
    return this.row.getByRole('cell').getByTestId('quantity-input');
  }

  get clearBinSelect() {
    return this.row.locator('.react-select__clear-indicator');
  }

  get putawayBinField() {
    return this.row.getByTestId('bin-select').getByRole('textbox');
  }
}

export default SplitModalTable;
