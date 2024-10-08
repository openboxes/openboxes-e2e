import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import CheckTable from '@/pages/receiving/components/CheckTable';

class CheckStep extends BasePageModel {
  table: CheckTable;

  constructor(page: Page) {
    super(page);
    this.table = new CheckTable(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
  }

  get receiveShipmentButton() {
    return this.page.getByRole('button', { name: 'Receive shipment' });
  }

  get shimpentInformation() {
    return this.page.locator('.form-title');
  }

  get originField() {
    return this.page.getByRole('textbox', { name: 'Origin' });
  }

  get destinationField() {
    return this.page.getByRole('textbox', { name: 'Destination' });
  }

  get shippedOnField() {
    return this.page.getByRole('textbox', { name: 'Shipped on' });
  }

  get deliveredOnField() {
    return this.page.getByRole('textbox', { name: 'Delivered on' });
  }
}

export default CheckStep;
