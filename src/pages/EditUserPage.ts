import { Page } from '@playwright/test';

import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';
import LocationRoleDialog from '@/pages/LocationRoleDialog';

class EditUserPage extends BasePageModel {
  locationRoleDialog: LocationRoleDialog;
  constructor(page: Page) {
    super(page);
    this.locationRoleDialog = new LocationRoleDialog(page);
  }
  async isLoaded() {
    await expect(this.page.locator('title')).toBeVisible();
  }

  get summary() {
    return this.page.getByRole('region', { name: 'summary' });
  }

  get actionButton() {
    return this.page.getByRole('button', { name: 'action' });
  }

  get deleteUserButton() {
    return this.page.getByRole('menuitem').filter({ hasText: 'Delete User' });
  }

  get userDetailsSection() {
    return this.page.getByRole('region', { name: 'User Details' });
  }

  get activateUser() {
    return this.userDetailsSection.getByRole('checkbox', { name: 'Active' });
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

  get defaultLocationSelect() {
    return this.page.getByTestId('default-location-select');
  }

  getDefaultLocation(name: string) {
    return this.page.getByRole('listitem').getByText(name, { exact: true });
  }

  get autoLogin() {
    return this.page.getByRole('checkbox', { name: 'Auto-login location' });
  }
}

export default EditUserPage;
