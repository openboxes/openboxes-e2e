import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import SplitModalTable from './SplitModalTable';

class SplitModal extends BasePageModel {
  table: SplitModalTable;

  constructor(page: Page) {
    super(page);
    this.table = new SplitModalTable(page);
  }

  get modal() {
    return this.page.locator('.ReactModal__Content');
  }

  async isLoaded() {
    await expect(this.modal).toBeVisible();
  }

  get saveButton() {
    return this.modal.getByTestId('save-button');
  }

  get cancelButton() {
    return this.modal.getByTestId('cancel-button');
  }

  get addLineButton() {
    return this.modal.getByTestId('add-line-button');
  }
}

export default SplitModal;
