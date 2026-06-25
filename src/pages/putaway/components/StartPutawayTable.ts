import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class StartPutawayTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('wizardPage').getByRole('grid');
  }

  get rows() {
    return this.table.getByRole('rowgroup');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  /**
    Returns the passed product names ordered by their actual vertical position
    in the table (top to bottom).
  */
  async getProductsOrder(productNames: string[]): Promise<string[]> {
    const positions: { name: string; y: number }[] = [];
    for (const name of productNames) {
      const cell = this.table
        .getByTestId('table-cell')
        .filter({ hasText: name })
        .first();
      const box = await cell.boundingBox();
      positions.push({ name, y: box?.y ?? Number.MAX_SAFE_INTEGER });
    }
    return positions.sort((a, b) => a.y - b.y).map((item) => item.name);
  }

  get qtyValidationTooltip() {
    return this.page.getByRole('tooltip');
  }

  assertValidationOnQtyField = async (errorContent: string) => {
    await expect(this.qtyValidationTooltip).toContainText(errorContent);
  };
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get editButton() {
    return this.row.getByTestId('edit-button');
  }

  get splitLineButton() {
    return this.row.getByTestId('open-modal');
  }

  get deleteButton() {
    return this.row.getByTestId('delete-button');
  }

  getItem(name: string) {
    return this.row.getByTestId('label-field').getByText(name);
  }

  get putawayBinSelect() {
    return this.row.getByTestId('select-bin');
  }

  get expandPutawayBinSelect() {
    return this.putawayBinSelect.locator('.react-select__dropdown-indicator');
  }

  getPutawayBin(putawayBin: string) {
    return this.page
      .getByTestId('custom-select-dropdown-menu')
      .getByRole('listitem')
      .getByText(putawayBin, { exact: true });
  }

  getCurrentBin(currentBin: string) {
    return this.row.getByTestId('table-cell').getByText(currentBin);
  }

  get preferredBin() {
    return this.row.getByTestId('table-cell').nth(8);
  }

  get currentdBin() {
    return this.row.getByTestId('table-cell').nth(9);
  }

  get quantityField() {
    return this.row.getByTestId('table-cell').nth(7);
  }

  get quantityInput() {
    return this.row.getByTestId('quantity-input');
  }

  get splitLineInPutawayBin() {
    return this.row.getByTestId('open-modal');
  }

  get lotField() {
    return this.row.getByTestId('table-cell').nth(4);
  }

  get expiryDateField() {
    return this.row.getByTestId('table-cell').nth(5);
  }

  getZoneLocation(zoneLocation: string) {
    return this.page
      .getByTestId('custom-select-dropdown-menu')
      .locator('.css-5ih5ya-group react-select__group-heading')
      .getByText(zoneLocation, { exact: true });
  }
}

export default StartPutawayTable;
