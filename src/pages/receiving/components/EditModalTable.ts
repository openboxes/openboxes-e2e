import { Locator, Page } from '@playwright/test';

import DatePicker from '@/components/DatePicker';
import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class EditModalTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('edit-modal-receiving-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  // rows are 1-indexed by convention (row 1 is the first item), matching the
  // rest of the receiving page objects. The header row doesn't carry
  // role="row", so it doesn't occupy index 0 on its own.
  row(index: number) {
    return new Row(this.page, this.rows.nth(index - 1));
  }
}

class Row extends BasePageModel {
  row: Locator;
  lotNumberField: TextField;
  expiryDatePickerField: DatePicker;
  receivingNowField: TextField;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.lotNumberField = new TextField(page, 'Lot/SN', row);
    this.expiryDatePickerField = new DatePicker(page, 'Exp Date', row);
    this.receivingNowField = new TextField(page, 'Receiving now', row);
  }

  get binLocationSelect() {
    return this.row.locator('[aria-label="Location"]');
  }

  get clearBinLocationButton() {
    return this.binLocationSelect.getByTestId('custom-select-clear');
  }

  get productSelect() {
    return this.row.locator('[aria-label="Product"]');
  }

  get clearProductSelect() {
    return this.productSelect.getByTestId('custom-select-clear');
  }

  async getProductSelect(name: string) {
    await this.productSelect
      .getByTestId('custom-select-element')
      .getByRole('textbox')
      .fill(name);
    await this.page
      .getByTestId('custom-select-dropdown-menu')
      .getByText(name)
      .first()
      .click();
  }
}

export default EditModalTable;
