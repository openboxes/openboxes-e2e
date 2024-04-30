import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class EditUserPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.locator('title')).toBeVisible();
  }

  get userTitle() {
    return this.page.locator('.summary .title');
  }

  get actionButton() {
    return this.page.locator('button.action-btn');
  }

  get deleteUserButton() {
    return this.page.getByRole('menuitem').filter({ hasText: 'Delete User' });
  }

  get activateUser() {
    return this.page.getByRole('checkbox').nth(0);
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  get authorizationTab() {
    return this.page.getByRole('tab', { name: 'Authorization' });
  }

  get defaultRoleSelect() {
    return this.page.getByTestId('default-roles-select');
  }

  getUserRole(role: string) {
    return this.defaultRoleSelect
      .getByRole('list')
      .getByText(role, { exact: true });
  }

  get impersonateButton() {
    return this.page.getByRole('link', { name: 'Impersonate' });
  }

  get addLocationRolesButton() {
    return this.page.getByRole('button', { name: 'Add Location Roles' });
  }

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

  get saveButtonOnLocationRoleDialog() {
    return this.page
      .getByRole('dialog', { name: 'Add Location Roles' })
      .getByRole('button', { name: 'Save' });
  }

  get defaultLocation() {
    return this.page.getByTestId('default-location-select');
  }

  getDefaultLocation(name: string) {
    return this.page.getByRole('listitem').getByText(name, { exact: true });
  }

  get autoLogin() {
    return this.page.locator('#rememberLastLocation');
  }
}

export default EditUserPage;
