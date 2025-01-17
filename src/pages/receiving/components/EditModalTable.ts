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

  get quantityShipped() {
    return this.row.getByRole('spinbutton');
  }
}

export default EditModalTable;
