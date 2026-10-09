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

  // the buttons are shown both above the table and at the bottom of the page,
  // so use the ones at the bottom
  get wizardButtons() {
    return this.page.getByTestId('wizard-page-buttons');
  }

  get receiveShipmentButton() {
    return this.wizardButtons.getByRole('button', { name: 'Complete Receipt' });
  }

  get shimpentInformation() {
    return this.page.getByTestId('confirm-receipt-details');
  }

  get originField() {
    return this.shimpentInformation.getByTestId('confirm-receipt-origin');
  }

  get destinationField() {
    return this.shimpentInformation.getByTestId('confirm-receipt-destination');
  }

  get shippedOnField() {
    return this.shimpentInformation.getByTestId('confirm-receipt-shipped-on');
  }

  get cancelAllRemainingButton() {
    return this.page.getByRole('button', { name: 'Cancel All Remaining' });
  }

  get validationOnDeliveredOnPastDatePopup() {
    return this.page
      .getByTestId('notification')
      .getByText('Must occur on or after Actual Shipping Date');
  }

  get backToEditButton() {
    return this.wizardButtons.getByRole('button', { name: 'Back to Receive' });
  }
}

export default CheckStep;
