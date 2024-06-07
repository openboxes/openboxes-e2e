import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class LocationGroupsListPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Edit Location groups')).toBeVisible();
  }

  get createLocationButton() {
    return this.page.getByText('Add Location group');
  }

  getusePagination(pageNumber: string) {
    return this.page.getByRole('link', { name: pageNumber, exact: true });
  }

  get locationGroupListTable() {
    return this.page.getByRole('table');
  }

  getLocationGroupnToEdit(locationGroupName: string) {
    return this.locationGroupListTable.getByRole('link', {
      name: locationGroupName,
      exact: true,
    });
  }
}

export default LocationGroupsListPage;
