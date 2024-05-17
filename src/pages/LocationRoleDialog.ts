import BasePageModel from '@/pages/BasePageModel';

class LocationRoleDialog extends BasePageModel {
  get locationSelectClearButton() {
    return this.locationForLocationRoleSelect.locator('.search-choice-close');
  }

  get locationForLocationRoleSelect() {
    return this.page.getByTestId('location-select');
  }

  getLocationForLocationRole(name: string) {
    return this.locationForLocationRoleSelect
      .getByRole('listitem')
      .getByText(name, { exact: true });
  }

  get locationRoleSelect() {
    return this.page.getByTestId('role-select');
  }

  getUserLocationRole(role: string) {
    return this.locationRoleSelect
      .getByRole('list')
      .getByText(role, { exact: true });
  }

  get saveButton() {
    return this.page
      .getByRole('dialog', { name: 'Add Location Roles' })
      .getByRole('button', { name: 'Save' });
  }
}

export default LocationRoleDialog;
