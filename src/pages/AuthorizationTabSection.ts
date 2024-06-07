import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import LocationRoleDialog from '@/pages/LocationRoleDialog';

class AuthorizationTabSection extends BasePageModel {
  locationRoleDialog: LocationRoleDialog;

  constructor(page: Page) {
    super(page);
    this.locationRoleDialog = new LocationRoleDialog(page);
  }

  get section() {
    return this.page.getByRole('region', { name: 'Authorization' });
  }

  get saveButton() {
    return this.section.getByRole('button', { name: 'Save' });
  }

  get defaultRoleSelect() {
    return this.section
      .getByTestId('default-roles-select')
      .locator('#roles_chosen');
  }

  getUserRole(role: string) {
    return this.section
      .getByTestId('default-roles-select')
      .getByRole('list')
      .getByText(role, { exact: true });
  }

  get addLocationRolesButton() {
    return this.section.getByRole('button', { name: 'Add Location Roles' });
  }

  get defaultLocationSelect() {
    return this.section.getByTestId('default-location-select');
  }

  getDefaultLocation(name: string) {
    return this.section.getByRole('listitem').getByText(name, { exact: true });
  }

  get autoLoginCheckbox() {
    return this.section.getByRole('checkbox', { name: 'Auto-login location' });
  }

  deleteLocationRole(locationName: string) {
    return this.section
      .getByRole('row')
      .filter({ hasText: locationName })
      .getByRole('link', { name: 'Delete' });
  }
}

export default AuthorizationTabSection;
