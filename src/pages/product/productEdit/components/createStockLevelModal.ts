import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CreateStockLevelModal extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get modal() {
    return this.page.getByRole('dialog');
  }

  get receivingTab() {
    return this.page.getByRole('link', { name: 'Receiving' });
  }

  get defaultPutawayLocation() {
    return this.modal.locator(
      'select[name="preferredBinLocation"] + .chosen-container'
    );
  }

  getDefaultPutawayLocation(putawayLocation: string) {
    return this.defaultPutawayLocation
      .locator('.chosen-results')
      .getByRole('listitem')
      .getByText(putawayLocation, { exact: true });
  }

  get createButton() {
    return this.modal.getByRole('button', { name: 'Create' });
  }

  get deleteInventoryLevelButton() {
    return this.modal.getByRole('link', { name: 'Delete' });
  }

  async clickDeleteInventoryLevel() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteInventoryLevelButton.click();
  }
}

export default CreateStockLevelModal;
