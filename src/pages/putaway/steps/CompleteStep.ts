import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import CompletePutawayTable from '../components/CompletePutawayTable';

class CompleteStep extends BasePageModel {
  table: CompletePutawayTable;

  constructor(page: Page) {
    super(page);
    this.table = new CompletePutawayTable(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
  }

  get completePutawayButton() {
    return this.page.getByTestId('complete-putaway-button').nth(1);
  }
}

export default CompleteStep;
