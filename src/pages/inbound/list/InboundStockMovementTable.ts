import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class InboundStockMovementTable extends BasePageModel {
  get table() {
    return this.page.getByTestId('data-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  get allStatusColumnCells() {
    return this.table.getByTestId('status-indicator');
  }

  get allOriginColumnCells() {
    return this.table.locator('[role="row"] [role="gridcell"]:nth-child(6)');
  }

  get allDateCreatedColumnCells() {
    return this.table.locator('[role="row"] [role="gridcell"]:nth-child(9)');
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get actions() {
    return this.row.getByRole('gridcell').nth(0);
  }

  get itemsCount() {
    return this.row.getByRole('gridcell').nth(1);
  }

  get status() {
    return this.row.getByRole('gridcell').nth(2);
  }

  get identifier() {
    return this.row.getByRole('gridcell').nth(3);
  }

  get name() {
    return this.row.getByRole('gridcell').nth(4);
  }

  get origin() {
    return this.row.getByRole('gridcell').nth(5);
  }

  get stocklist() {
    return this.row.getByRole('gridcell').nth(6);
  }

  get requestedBy() {
    return this.row.getByRole('gridcell').nth(7);
  }

  get dateCreated() {
    return this.row.getByRole('gridcell').nth(8);
  }

  get expectedReceiptDate() {
    return this.row.getByRole('gridcell').nth(9);
  }

  async assertIsEmpty() {
    await expect(this.actions).toBeEmpty();
    await expect(this.itemsCount).toBeEmpty();
    await expect(this.status).toBeEmpty();
    await expect(this.identifier).toBeEmpty();
  }

  async assertIsisNotEmpty() {
    await expect(this.actions).not.toBeEmpty();
    await expect(this.itemsCount).not.toBeEmpty();
    await expect(this.status).not.toBeEmpty();
    await expect(this.identifier).not.toBeEmpty();
  }
}
export default InboundStockMovementTable;
