import { Page } from '@playwright/test';

import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

import LocationConfigurationTabSection from './LocationConfigurationTabSection';
import LocationDetailsTabSection from './LocationDetailsTabSection';

class CreateLocationPage extends BasePageModel {
  locationDetailsTabSection: LocationDetailsTabSection;
  locationConfigurationTabSection: LocationConfigurationTabSection;

  constructor(page: Page) {
    super(page);
    this.locationDetailsTabSection = new LocationDetailsTabSection(page);
    this.locationConfigurationTabSection = new LocationConfigurationTabSection(
      page
    );
  }
  async isLoaded() {
    await expect(this.page.getByText('New Location')).toBeVisible();
  }

  get locationConfigurationTab() {
    return this.page.getByRole('link', { name: 'Configuration' });
  }

  get actionButton() {
    return this.page.getByRole('button', { name: 'action' });
  }

  get deleteLocationButton() {
    return this.page
      .getByRole('menuitem')
      .filter({ hasText: 'Delete Location' });
  }

  async clickDeleteLocation() {
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.deleteLocationButton.click();
  }
}

export default CreateLocationPage;
