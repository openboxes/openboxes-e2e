import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import StartPutawayTable from '../components/StartPutawayTable';

class StartStep extends BasePageModel {
  table: StartPutawayTable;

  constructor(page: Page) {
    super(page);
    this.table = new StartPutawayTable(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
  }

  get nextButton() {
    return this.page.getByTestId('next-button');
  }

  get saveButton() {
    return this.page.getByTestId('save-button');
  }
}

export default StartStep;
