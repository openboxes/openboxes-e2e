import { Locator, Page } from '@playwright/test';

import Select from '@/components/Select';
import TextField from '@/components/TextField';
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
  productSelect: Select;
  recipientSelect: Select;
  packLevel1Field: TextField;
  packLevel2Field: TextField;
  lotField: TextField;
  quantityField: TextField;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.productSelect = new Select(page, 'Product', row);
    this.recipientSelect = new Select(page, 'Recipient', row);
    this.packLevel1Field = new TextField(page, 'Pack level 1', row);
    this.packLevel2Field = new TextField(page, 'Pack level 2', row);
    this.lotField = new TextField(page, 'Lot', row);
    this.quantityField = new TextField(page, 'Qty', row);
  }

  get deleteButton() {
    return this.row.getByRole('button', { name: 'Delete' });
  }
}

export default AddItemsTable;