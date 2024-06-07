import BasePageModel from '@/pages/BasePageModel';

class LocationDetailsTabSection extends BasePageModel {
  get section() {
    return this.page.getByRole('region', { name: 'Location' });
  }

  get locationName() {
    return this.page.locator('#name');
  }

  get organizationSelect() {
    return this.section.getByTestId('organization-select');
  }

  getOrganization(organizationName: string) {
    return this.section
      .getByTestId('organization-select')
      .getByRole('list')
      .getByText(organizationName, { exact: true });
  }

  get locationTypeSelect() {
    return this.section.getByTestId('location-type-select');
  }

  getlocationType(locationType: string) {
    return this.section
      .getByTestId('location-type-select')
      .getByRole('list')
      .getByText(locationType, { exact: true });
  }

  get locationGroupSelect() {
    return this.section.getByTestId('location-group-select');
  }

  getLocationGroup(locationGroup: string) {
    return this.section
      .getByTestId('location-group-select')
      .getByRole('list')
      .getByText(locationGroup, { exact: true });
  }

  get saveButton() {
    return this.section.getByRole('button', { name: 'Save' });
  }
}

export default LocationDetailsTabSection;
