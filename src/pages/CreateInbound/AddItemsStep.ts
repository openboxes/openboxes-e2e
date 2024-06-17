import {  Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import AddItemsTable from './AddItemsTable';


class AddItemsStep extends BasePageModel {
  table: AddItemsTable;

  constructor(page: Page) {
    super(page);
    this.table = new AddItemsTable(page);
  }

  async waitForData() {
    await this.page.waitForResponse(/\/api\/stockMovements\/.*\/stockMovementItems/);
  }

  get addLineButton() {
    return this.page.getByRole('button', { name: 'Add line' });
  }
}

export default AddItemsStep;
