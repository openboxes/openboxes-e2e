import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import EditModalTable from '@/pages/receiving/components/EditModalTable';

class EditModal extends BasePageModel {
  table: EditModalTable;

  constructor(page: Page) {
    super(page);
    this.table = new EditModalTable(page);
  }

  get modal() {
    return this.page.locator('.ReactModal__Content');
  }

  async isLoaded() {
    await expect(this.modal).toBeVisible();
  }

  get saveButton() {
    return this.modal.getByRole('button', { name: 'Save' });
  }

  get cancelButton() {
    return this.modal.getByRole('button', { name: 'Cancel' });
  }

  get addLineButton() {
    return this.modal.getByRole('button', { name: 'Add line' });
  }

  get informationAboutEditedQtyNotMatchingShippedQty() {
    return this.modal
      .locator('.font-weight-bold font-red-ob')
      .getByText(
        'The total edited quantity does not match the original quantity shipped.'
      );
  }
}

export default EditModal;
