import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import SplitModal from '@/pages/putaway/components/SplitModal';
import StartPutawayTable from '@/pages/putaway/components/StartPutawayTable';

class StartStep extends BasePageModel {
  table: StartPutawayTable;
  splitModal: SplitModal;

  constructor(page: Page) {
    super(page);
    this.table = new StartPutawayTable(page);
    this.splitModal = new SplitModal(page);
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

  get generatePutawayListButton() {
    return this.page.getByTestId('export-button');
  }

  get sortByCurrentBinButton() {
    return this.page.getByTestId('sort-button');
  }

  get validationOnEditCompletedPutaway() {
    return this.page
      .locator('[class*="alert"]')
      .getByText(/Can't update completed putaway/);
  }

  get validationOnDeleteItemFromCompletedPutaway() {
    return this.page
      .locator('[class*="alert"]')
      .getByText(/Can't remove an item on completed putaway/);
  }

  async closeDisplayedError() {
    return this.page.locator('.alert-close-icon').first().click();
  }
}

export default StartStep;
