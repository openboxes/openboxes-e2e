import { Locator, Page } from '@playwright/test';

import DatePicker from '@/components/DatePicker';
import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class EditModalTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.locator('#modalForm');
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
  lotNumberField: TextField;
  expiryDatePickerField: DatePicker;
  quantityShippedField: TextField;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.lotNumberField = new TextField(page, 'Lot', row);
    this.expiryDatePickerField = new DatePicker(page, 'Expiry', row);
    this.quantityShippedField = new TextField(page, 'Quantity shipped', row);
  }

  get clearProductSelect() {
    return this.row.locator('.react-select__clear-indicator');
  }

  async getProductSelect(name: string) {
    await this.row
      .getByTestId('custom-select-element')
      .getByRole('textbox')
      .fill(name);
    await this.page
      .getByTestId('custom-select-dropdown-menu')
      .locator('.react-select__option')
      .nth(0)
      .click();
  }
}

export default EditModalTable;
