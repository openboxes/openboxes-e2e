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
    return this.page.getByTestId('receiving-edit-line-item-modal');
  }

  async isLoaded() {
    await expect(this.modal).toBeVisible();
  }

  get saveButton() {
    return this.modal.getByRole('button', { name: 'Save', exact: true });
  }

  get cancelButton() {
    return this.modal.getByRole('button', { name: 'Cancel' });
  }

  get addLineButton() {
    return this.modal.getByTestId('add-new-record');
  }
}

export default EditModal;
