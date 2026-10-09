import { Locator, Page } from '@playwright/test';

import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class ReceivingTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('receiving-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  // rows are 1-indexed by convention (row 1 is the first item), matching the
  // rest of the receiving page objects. Unlike the old table, the header row
  // no longer carries role="row", so it doesn't occupy index 0 on its own.
  row(index: number) {
    return new Row(this.page, this.rows.nth(index - 1));
  }

  // the order of the items depends on the sorting, so find the row by its
  // product code instead of its position
  rowByProductCode(productCode: string) {
    return new Row(
      this.page,
      this.rows.filter({
        has: this.page
          .locator('[aria-label="Code"]')
          .getByText(productCode, { exact: true }),
      })
    );
  }

  getColumnHeader(columnName: string) {
    return this.table
      .getByTestId('table-header')
      .getByText(columnName, { exact: true });
  }

  getCellValue(row: number, column: string) {
    return this.rows.nth(row - 1).locator(`[aria-label="${column}"]`);
  }

  // "Autofill" select in the Location column header (visible only when the
  // "Show Putaway" switch is on)
  get locationAutofillSelect() {
    return this.table.getByTestId('location-autofill');
  }

  // shown when the autofill would overwrite a location the user has changed
  get autofillLocationConfirmDialog() {
    return this.page.getByTestId('confirm-modal');
  }

  get acceptAutofillLocationConfirmDialog() {
    return this.autofillLocationConfirmDialog.getByRole('button', {
      name: 'Yes',
    });
  }

  async autofillLocation(option: string) {
    await this.locationAutofillSelect.click();
    await this.page
      .getByTestId('custom-select-dropdown-menu')
      .getByText(option, { exact: true })
      .click();
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

  get editButton() {
    return this.row.getByRole('button', { name: 'Edit' });
  }

  get commentButton() {
    return this.row.getByRole('button', { name: 'Comment' });
  }

  // visible only when the "Show Putaway" switch is on
  get binLocationSelect() {
    return this.row.locator('[aria-label="Location"]');
  }

  // the selected value only, without the screen reader text react-select
  // renders next to it while focused
  get selectedBinLocation() {
    return this.binLocationSelect.getByTestId('custom-select-value');
  }

  get clearBinLocationButton() {
    return this.binLocationSelect.getByTestId('custom-select-clear');
  }

  getBinLocation(binLocation: string) {
    return this.page
      .getByTestId('custom-select-dropdown-menu')
      .getByText(binLocation, { exact: true });
  }

  async selectBinLocation(binLocation: string) {
    await this.binLocationSelect.click();
    await this.page.keyboard.type(binLocation);
    await this.getBinLocation(binLocation).click();
  }

  getItem(name: string) {
    return this.row.locator('[aria-label="Product"]').getByText(name);
  }

  // shown only when at least one item has a recipient, and read-only (it can
  // only be changed in the edit modal)
  get recipient() {
    return this.row.locator('[aria-label="Recipient"]');
  }
}

export default ReceivingTable;
