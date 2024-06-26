import BasePageModel from '@/pages/BasePageModel';

class LocationDetailsTabSection extends BasePageModel {
  get section() {
    return this.page.getByRole('region', { name: 'Location' });
  }

  get locationNameField() {
    return this.section.getByRole('textbox', { name: 'Name' });
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

  getlocationTypeOption(locationType: string) {
    return this.locationTypeSelect
      .getByRole('list')
      .getByText(locationType, { exact: true });
  }

  get locationGroupSelect() {
    return this.section.getByTestId('location-group-select');
  }

  getLocationGroupOption(locationGroup: string) {
    return this.locationGroupSelect
      .getByRole('list')
      .getByText(locationGroup, { exact: true });
  }

  get saveButton() {
    return this.section.getByRole('button', { name: 'Save' });
  }
}

export default LocationDetailsTabSection;
