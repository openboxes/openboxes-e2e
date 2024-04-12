import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class LocationChooser extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Choose Location')).toBeVisible();
  }

  getOrganization(name: string) {
    return this.page
      .getByTestId('location-organization-list')
      .getByRole('listitem')
      .filter({ hasText: name });
  }

  getLocation(name: string) {
    return this.page.getByTestId('location-list').getByText(name);
  }
}

export default LocationChooser;
