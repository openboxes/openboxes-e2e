import BasePageModel from '@/pages/BasePageModel';
import { expect, Page } from '@playwright/test';
import AddBinLocationDialog from '../components/AddBinLocationDialog';

class BinLocationsTabSection extends BasePageModel {
  addBinLocationDialog: AddBinLocationDialog;

  constructor(page: Page) {
    super(page);
    this.addBinLocationDialog = new AddBinLocationDialog(page);
  }

  get section() {
    return this.page.getByRole('region', { name: 'Bin Locations' });
  }

  async isLoaded() {
    await expect(
      this.page.locator('.box').getByText('Bin Locations')
    ).toBeVisible();
  }

  get addBinLocationButton() {
    return this.page.getByRole('button', { name: 'Add Bin Location' });
  }

  get searchField() {
    return this.page.getByRole('textbox', { name: 'Search:' });
  }

  get deleteBinButton() {
    return this.page.getByRole('link', { name: 'Delete' });
  }
}

export default BinLocationsTabSection;
