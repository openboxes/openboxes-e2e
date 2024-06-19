import { Locator, Page } from '@playwright/test';

import FieldLabel from '@/components/FieldLabel';
import BasePageModel from '@/pages/BasePageModel';

class SendPageTable extends BasePageModel {


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

  packLevel1: FieldLabel;
  packLevel2: FieldLabel;
  productCode: FieldLabel;
  productName: FieldLabel;
  lotNumber: FieldLabel;
  expirationDate: FieldLabel;
  quantityPicked: FieldLabel;
  recipient: FieldLabel;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;

    this.packLevel1 = new FieldLabel(page, 'Pack level 1', row);
    this.packLevel2 = new FieldLabel(page, 'Pack level 2', row);
    this.productCode = new FieldLabel(page, 'Code', row);
    this.productName = new FieldLabel(page, 'Product', row);
    this.lotNumber = new FieldLabel(page, 'Lot', row);
    this.expirationDate = new FieldLabel(page, 'Expiry', row);
    this.quantityPicked = new FieldLabel(page, 'Qty Picked', row);
    this.recipient = new FieldLabel(page, 'Recipient', row);
  }
}

export default SendPageTable;
