import BasePageModel from '@/pages/BasePageModel';

class AddZoneLocationDialog extends BasePageModel {
  get zoneLocationNameField() {
    return this.page.locator('#dlgAddZoneLocation').locator('#name');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }
}

export default AddZoneLocationDialog;
