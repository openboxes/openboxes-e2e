import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class OrganizationListPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('List Organization')).toBeVisible();
  }

  get createOrganizationButton() {
    return this.page.getByText('Add Organization');
  }

  get searchByOrganizationNameField() {
    return this.page.locator('#q');
  }

  get searchButton() {
    return this.page.getByRole('button', { name: 'search' });
  }

  get OrganizationListTable() {
    return this.page.getByRole('table');
  }

  getOrganizationToEdit(organizationName: string) {
    return this.OrganizationListTable.getByRole('link', {
      name: organizationName,
      exact: true,
    });
  }
}

export default OrganizationListPage;
