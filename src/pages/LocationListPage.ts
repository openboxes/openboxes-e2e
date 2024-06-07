import BasePageModel from '@/pages/BasePageModel';

class LocationListPage extends BasePageModel {
  get createLocationButton() {
    return this.page.getByText('Create location');
  }

  get searchByLocationNameField() {
    return this.page.locator('#q');
  }

  get locationTypeSelect() {
    return this.page.getByTestId('location-type-select');
  }

  getSelectLocationType(locationType: string) {
    return this.page
      .getByTestId('location-type-select')
      .getByRole('listitem')
      .getByText(locationType, { exact: true });
  }

  get findButton() {
    return this.page.getByRole('button', { name: 'Find' });
  }

  get locationListTable() {
    return this.page.getByRole('table');
  }

  getLocationToEdit(locationName: string) {
    return this.locationListTable.getByRole('link', {
      name: locationName,
      exact: true,
    });
  }
}

export default LocationListPage;
