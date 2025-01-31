import BasePageModel from '@/pages/BasePageModel';
import { expect, Page } from '@playwright/test';
import AddZoneLocationDialog from '@/pages/location/createLocation//components/AddZoneLocationDialog';

class ZoneLocationsTabSection extends BasePageModel {
  addZoneLocationDialog: AddZoneLocationDialog;

  constructor(page: Page) {
    super(page);
    this.addZoneLocationDialog = new AddZoneLocationDialog(page);
  }

  get section() {
    return this.page.getByRole('region', { name: 'Zone Locations' });
  }

  async isLoaded() {
    await expect(
      this.page.getByRole('heading', { name: 'Zone Locations' })
    ).toBeVisible();
  }

  get addZoneLocationButton() {
    return this.page.getByRole('button', { name: 'Add Zone Locations' });
  }

  get searchField() {
    return this.page.getByRole('textbox', { name: 'Search:' });
  }

  get deleteZoneButton() {
    return this.page.getByRole('link', { name: 'Delete' });
  }
}

export default ZoneLocationsTabSection;
