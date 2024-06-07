import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class LocationChooser extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Choose Location')).toBeVisible();
  }

  getOrganization(name = 'No organization') {
    return this.page
      .getByTestId('location-organization-list')
      .getByRole('tab')
      .filter({ hasText: name });
  }

  getLocation(name: string) {
    return this.page.getByTestId('location-list').getByText(name);
  }

  get locationChooserLogoutButton() {
    return this.page.getByRole('link', { name: 'Logout' });
  }

  get emptyLocationChooser() {
    return this.page.getByText('No locations available');
  }

  getLocationGroup(name: string) {
    return this.page
      .getByTestId('location-list')
      .getByRole('heading')
      .getByText(name);
  }

  get closeLocationChooserButton() {
    return this.page.getByRole('button', { name: 'close' });
  }

  get yourLastSingInInfo() {
    return this.page.getByText('Your last sign-in occurred');
  }
}

export default LocationChooser;
