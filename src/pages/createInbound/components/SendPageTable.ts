import { Locator, Page } from '@playwright/test';

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

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get packLevel1() {
    return this.row.locator(
      '[data-testid="label-field"][aria-label="Pack level 1"]'
    );
  }

  get packLevel2() {
    return this.row.locator(
      '[data-testid="label-field"][aria-label="Pack level 2"]'
    );
  }

  get productCode() {
    return this.row.locator('[data-testid="label-field"][aria-label="Code"]');
  }

  get productName() {
    return this.row.locator(
      '[data-testid="label-field"][aria-label="Product"]'
    );
  }

  get lotNumber() {
    return this.row.locator('[data-testid="label-field"][aria-label="Lot"]');
  }

  get expirationDate() {
    return this.row.locator('[data-testid="label-field"][aria-label="Expiry"]');
  }

  get quantityPicked() {
    return this.row.locator(
      '[data-testid="label-field"][aria-label="Qty Picked"]'
    );
  }

  get recipient() {
    return this.row.locator(
      '[data-testid="label-field"][aria-label="Recipient"]'
    );
  }
}

export default SendPageTable;
