import BasePageModel from '@/pages/BasePageModel';

class LocationListPage extends BasePageModel {
  get createLocationButton() {
    return this.page.getByText('Create location');
  }

  get searchByLocationNameField() {
    return this.page.getByRole('textbox', { name: 'Name' });
  }

  get locationTypeSelect() {
    return this.page.getByTestId('location-type-select');
  }

  getSelectLocationTypeOption(locationType: string) {
    return this.locationTypeSelect
      .getByRole('listitem')
      .getByText(locationType, { exact: true });
  }

  get findButton() {
    return this.page.getByRole('button', { name: 'Find' });
  }

  get locationListTable() {
    return this.page.getByRole('table');
  }

  getLocationEditButton(locationName: string) {
    return this.locationListTable.getByRole('link', {
      name: locationName,
      exact: true,
    });
  }
}

export default LocationListPage;
