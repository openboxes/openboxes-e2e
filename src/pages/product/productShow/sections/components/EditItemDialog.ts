import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class EditItemDialog extends BasePageModel {
  get editItemDialog() {
    return this.page.getByRole('dialog', { name: 'Edit Item' });
  }

  async isLoaded() {
    await expect(this.editItemDialog).toBeVisible();
  }

  get lotField() {
    return this.editItemDialog.locator('#lotNumber');
  }

  get saveButton() {
    return this.editItemDialog.getByRole('button', {
      name: 'Save',
    });
  }
}

export default EditItemDialog;
