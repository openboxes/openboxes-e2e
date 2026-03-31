import { expect, Locator, Page } from '@playwright/test';

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
    return this.row.getByTestId('open-modal');
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

  getCurrentBin(currentBin: string) {
    return this.row.getByTestId('table-cell').getByText(currentBin);
  }

  get preferredBin() {
    return this.row.getByTestId('table-cell').nth(8);
  }

  get quantityField() {
    return this.row.getByTestId('table-cell').nth(7);
  }

  get quantityInput() {
    return this.row.getByTestId('quantity-input');
  }

  get splitLineInPutawayBin() {
    return this.row.getByTestId('open-modal');
  }

  get tooltip() {
    return this.page.getByRole('tooltip');
  }

  assertValidationOnQtyField = async (errorContent: string) => {
    await expect(this.tooltip).toContainText(errorContent);
  };
}

export default StartPutawayTable;
