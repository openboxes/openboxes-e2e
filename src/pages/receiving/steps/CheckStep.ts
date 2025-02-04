import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import CheckTable from '@/pages/receiving/components/CheckTable';
import DatePicker from '@/components/DatePicker';
class CheckStep extends BasePageModel {
  table: CheckTable;

  deliveredOnDateField: DatePicker;

  constructor(page: Page) {
    super(page);
    this.table = new CheckTable(page);
    this.deliveredOnDateField = new DatePicker(page, 'Delivered on');
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

  get cancelAllRemainingButton() {
    return this.page.getByRole('button', { name: 'Cancel all remaining' });
  }

  get validationOnDeliveredOnPastDatePopup() {
    return this.page
      .locator('.s-alert-box-inner')
      .getByText('Must occur on or after Actual Shipping Date');
  }
}

export default CheckStep;
