import { expect, Page } from '@playwright/test';

import AlertPopup from '@/components/AlertPopup';
import DatePicker from '@/components/DatePicker';
import Select from '@/components/Select';
import BasePageModel from '@/pages/BasePageModel';
import SendPageTable from '@/pages/createInbound/components/SendPageTable';

class SendStep extends BasePageModel {
  table: SendPageTable;

  destinationSelect: Select;
  shipmentTypeSelect: Select;
  shipDateDatePicker: DatePicker;
  expectedDeliveryDatePicker: DatePicker;

  validationPopup: AlertPopup;

  constructor(page: Page) {
    super(page);
    this.table = new SendPageTable(page);

    this.destinationSelect = new Select(page, 'Destination');
    this.shipmentTypeSelect = new Select(page, 'Shipment type');
    this.shipDateDatePicker = new DatePicker(page, 'Shipment date');
    this.expectedDeliveryDatePicker = new DatePicker(
      page,
      'Expected receipt date'
    );

    this.validationPopup = new AlertPopup(page, 'Continue (lose unsaved work)', 'Correct error');
  }

  get sendShipmentButton() {
    return this.page.getByRole('textbox', { name: 'Send shipment' });
  }

  get originField() {
    return this.page.getByRole('textbox', { name: 'ORIGIN' });
  }

  get trackingNumberField() {
    return this.page.getByRole('textbox', { name: 'TRACKING NUMBER' });
  }

  get driverNameField() {
    return this.page.getByRole('textbox', { name: 'DRIVER NAME' });
  }

  get commentField() {
    return this.page.getByRole('textbox', { name: 'COMMENT' });
  }

  async isLoaded() {
    await expect(this.originField).toBeVisible();
    await expect(this.destinationSelect.selectField).toBeVisible();
    await expect(this.shipmentTypeSelect.selectField).toBeVisible();
    await expect(this.shipDateDatePicker.dateInputField).toBeVisible();
    await expect(this.expectedDeliveryDatePicker.dateInputField).toBeVisible();
    await expect(this.trackingNumberField).toBeVisible();
    await expect(this.driverNameField).toBeVisible();
    await expect(this.commentField).toBeVisible();
  }
}

export default SendStep;
