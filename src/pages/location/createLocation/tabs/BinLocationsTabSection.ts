import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import AddBinLocationDialog from '@/pages/location/createLocation/components/AddBinLocationDialog';

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

  get table() {
    return this.page.locator('.box').getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
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

  get editBinButton() {
    return this.page.getByRole('link', { name: 'Edit', exact: true });
  }

  get emptyBinLocationTable() {
    return this.table.getByText('No matching records found');
  }
}
class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get binLocation() {
    return this.row.locator('td').nth(1).getByRole('link');
  }
}

export default BinLocationsTabSection;
