import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CountStepTable extends BasePageModel {
  get table() {
    return this.page.locator('.count-step-table .ReactTable');
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

  get quantityCountedInput() {
    return this.cells.nth(3).locator('input');
  }

  get commentInput() {
    return this.cells.nth(4).locator('input');
  }

  // this field's onChange only registers with per-key events and a real Tab-driven
  // blur; .fill() and a programmatic .blur() both leave the app unaware of the
  // change, so the value snaps back to empty. Typing can also drop a keystroke
  // under automation, so retry the whole sequence until the value sticks.
  async fillQuantityCounted(value: string) {
    await expect(async () => {
      await this.quantityCountedInput.click();
      await this.page.keyboard.press('ControlOrMeta+A');
      await this.quantityCountedInput.pressSequentially(value, {
        delay: 100,
      });
      await this.page.keyboard.press('Tab');
      await expect(this.quantityCountedInput).toHaveValue(value, {
        timeout: 2000,
      });
    }).toPass({ timeout: 20000 });
  }
}

export default CountStepTable;
