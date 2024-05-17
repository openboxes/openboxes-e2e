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
}

export default LocationChooser;
