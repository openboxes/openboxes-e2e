import { Locator, Page } from '@playwright/test';

import SelectComponent from '@/components/SelectComponent';
import BasePageModel from '@/pages/BasePageModel';

class AddItemsTable extends BasePageModel {
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
  productSelect: SelectComponent;
  recipientSelect: SelectComponent;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.productSelect = new SelectComponent(page, 'Product', row);
    this.recipientSelect = new SelectComponent(page, 'Recipient', row);
  }
  
  get packLevel1Field() {
    return this.row
      .locator('[data-testid="form-field"][aria-label="Pack level 1"]')
      .getByRole('textbox');
  }

  get packLevel2Field() {
    return this.row
      .locator('[data-testid="form-field"][aria-label="Pack level 2"]')
      .getByRole('textbox');
  }

  get lotField() {
    return this.row
      .locator('[data-testid="form-field"][aria-label="Lot"]')
      .getByRole('textbox');
  }

  get quantityField() {
    return this.row
      .locator('[data-testid="form-field"][aria-label="Qty"]')
      .getByRole('spinbutton');
  }

  get deleteButton() {
    return this.row
      .getByRole('button', { name: 'Delete' });
  }
}

export default AddItemsTable;
