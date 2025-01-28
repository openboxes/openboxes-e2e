import BasePageModel from '@/pages/BasePageModel';

class AddBinLocationDialog extends BasePageModel {
  get binLocationNameField() {
    return this.page.locator('#dlgAddBinLocation').locator('#name');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }
}

export default AddBinLocationDialog;
