import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import StockTransferDialog from '@/pages/product/productShow/sections/components/StockTransferDialog';

class InStockTabSection extends BasePageModel {
  stockTransferDialog: StockTransferDialog;

  constructor(page: Page) {
    super(page);
    this.stockTransferDialog = new StockTransferDialog(page);
  }

  async isLoaded() {
    await expect(
      this.page.getByRole('heading').getByText('Current stock')
    ).toBeVisible();
  }

  get table() {
    return this.page.locator('#ui-tabs-1').getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  get stockTransferButton() {
    return this.page.getByRole('link', { name: 'Transfer Stock' });
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get actionsButton() {
    return this.row.locator('.action-menu').getByRole('button');
  }

  get binLocation() {
    return this.row
      .locator('.line')
      .locator('.line-extension')
      .getByRole('link');
  }

  get defaultBinLocation() {
    return this.row.locator('.line').getByText('Default');
  }

  get zoneLocation() {
    return this.row.locator('.line').locator('.line-base').getByRole('link');
  }

  get inventoryInformation() {
    return this.row.locator('td').nth(6);
  }

  get quantityOnHand() {
    return this.row.locator('td').nth(4);
  }

  get lot() {
    return this.row.locator('td').nth(2);
  }

  get expires() {
    return this.row.locator('td').nth(3);
  }
}

export default InStockTabSection;
