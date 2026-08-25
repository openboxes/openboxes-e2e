import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import { findRowIndexByText } from '@/utils/tableUtils';

class RecountStepTable extends BasePageModel {
  get table() {
    return this.page.locator('.resolve-step-table .ReactTable');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  getRowIndexByBinLocation(binLocationName: string) {
    return findRowIndexByText(this.rows, binLocationName);
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get cells() {
    return this.row.locator('.rt-td');
  }

  get binLocation() {
    return this.cells.nth(0);
  }

  get serialLotNumber() {
    return this.cells.nth(1);
  }

  get expirationDate() {
    return this.cells.nth(2);
  }

  get quantityCounted() {
    return this.cells.nth(3);
  }

  get countDifferenceValue() {
    return this.cells.nth(4).locator('.value-indicator');
  }

  get countDifferenceIcon() {
    return this.cells.nth(4).locator('svg');
  }

  get quantityRecountedInput() {
    return this.cells.nth(5).locator('input');
  }

  // same input as CountStepTable.fillQuantityCounted:
  // .fill()/.blur() are silently ignored, needs pressSequentially + a real Tab.
  // Typing can also drop a keystroke under automation, so retry the whole
  // sequence until the value sticks.
  async fillQuantityRecounted(value: string) {
    await expect(async () => {
      await this.quantityRecountedInput.click();
      await this.page.keyboard.press('ControlOrMeta+A');
      await this.quantityRecountedInput.pressSequentially(value, {
        delay: 100,
      });
      await this.page.keyboard.press('Tab');
      await expect(this.quantityRecountedInput).toHaveValue(value, {
        timeout: 2000,
      });
    }).toPass({ timeout: 20000 });
  }

  get recountDifferenceValue() {
    return this.cells.nth(6).locator('.value-indicator');
  }

  get recountDifferenceIcon() {
    return this.cells.nth(6).locator('svg');
  }

  get rootCauseSelect() {
    return this.cells.nth(7);
  }

  get commentInput() {
    return this.cells.nth(8).locator('input');
  }
}

export default RecountStepTable;
