import { LOCATION_GROUP_URL } from '@/constants/applicationUrls';
import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class LocationGroupsListPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Edit Location groups')).toBeVisible();
  }

  get createLocationButton() {
    return this.page.getByText('Add Location group');
  }

  async goToPage(params: { max: number }) {
    this.page.goto(LOCATION_GROUP_URL.list(params));
  }

  getPaginationItem(pageNumber: string) {
    return this.page
      .getByLabel('pagination')
      .getByRole('link', { name: pageNumber, exact: true });
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
