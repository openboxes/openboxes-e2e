import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import EditItemDialog from '@/pages/product/productShow/sections/components/EditItemDialog';
import StockTransferDialog from '@/pages/product/productShow/sections/components/StockTransferDialog';

class InStockTabSection extends BasePageModel {
  stockTransferDialog: StockTransferDialog;
  editItemDialog: EditItemDialog;

  constructor(page: Page) {
    super(page);
    this.stockTransferDialog = new StockTransferDialog(page);
    this.editItemDialog = new EditItemDialog(page);
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

  /**
   * Select a row by its bin location name instead of a positional index.
   * Residual stock in shared bins can add unexpected rows (see
   * validateCleanState.setup.ts), shifting indices so `row(n)` reads the
   * wrong bin. Matching by name keeps the assertion pinned to the bin we
   * actually put away into.
   */
  getRowByBinLocation(binLocation: string) {
    return new Row(
      this.page,
      this.rows.filter({ hasText: binLocation }).first()
    );
  }

  get stockTransferButton() {
    return this.page.getByRole('link', { name: 'Transfer Stock' });
  }

  get editItem() {
    return this.page.getByRole('link', { name: 'Edit item' });
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
