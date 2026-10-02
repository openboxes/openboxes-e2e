import { expect, Page } from '@playwright/test';

import DatePicker from '@/components/DatePicker';
import BasePageModel from '@/pages/BasePageModel';
import CheckTable from '@/pages/receiving/components/CheckTable';
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
    await expect(this.table.table.getByText('Loading...')).toBeHidden({
      timeout: 20_000,
    });
  }

  get receiveShipmentButton() {
    return this.page
      .locator('.submit-buttons')
      .getByRole('button', { name: 'Complete Receipt' });
  }

  get shimpentInformation() {
    return this.page.getByTestId('confirm-receipt-details');
  }

  get originField() {
    return this.shimpentInformation.locator(
      '.item-details__field:has-text("Origin:") .item-details__value'
    );
  }

  get destinationField() {
    return this.shimpentInformation.locator(
      '.item-details__field:has-text("Destination:") .item-details__value'
    );
  }

  get shippedOnField() {
    return this.shimpentInformation.locator(
      '.item-details__field:has-text("Shipped on:") .item-details__value'
    );
  }

  get cancelAllRemainingButton() {
    return this.page.getByRole('button', { name: 'Cancel All Remaining' });
  }

  get validationOnDeliveredOnPastDatePopup() {
    return this.page
      .locator('.s-alert-box-inner')
      .getByText('Must occur on or after Actual Shipping Date');
  }

  get backToEditButton() {
    return this.page.getByRole('button', { name: 'Back to edit' });
  }
}

export default CheckStep;
