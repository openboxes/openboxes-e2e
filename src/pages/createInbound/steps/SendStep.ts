import { expect, Page } from '@playwright/test';

import AlertPopup from '@/components/AlertPopup';
import DatePicker from '@/components/DatePicker';
import Select from '@/components/Select';
import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';
import SendPageTable from '@/pages/createInbound/components/SendPageTable';

class SendStep extends BasePageModel {
  table: SendPageTable;

  destinationSelect: Select;
  shipmentTypeSelect: Select;
  shipDateDatePicker: DatePicker;
  expectedDeliveryDatePicker: DatePicker;
  originField: TextField;
  trackingNumberField: TextField;
  driverNameField: TextField;
  commentField: TextField;

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
    this.originField = new TextField(page, 'Origin');
    this.trackingNumberField = new TextField(page, 'Tracking number');
    this.driverNameField = new TextField(page, 'Driver name');
    this.commentField = new TextField(page, 'Comments');

    this.validationPopup = new AlertPopup(
      page,
      'Continue (lose unsaved work)',
      'Correct error'
    );
  }

  get sendShipmentButton() {
    return this.page.getByRole('button', { name: 'Send shipment' });
  }

  async isLoaded() {
    await expect(this.originField.textbox).toBeVisible();
    await expect(this.destinationSelect.selectField).toBeVisible();
    await expect(this.shipmentTypeSelect.selectField).toBeVisible();
    await expect(this.shipDateDatePicker.textbox).toBeVisible();
    await expect(this.expectedDeliveryDatePicker.textbox).toBeVisible();
    await expect(this.trackingNumberField.textbox).toBeVisible();
    await expect(this.driverNameField.textbox).toBeVisible();
    await expect(this.commentField.textbox).toBeVisible();
  }
}

export default SendStep;
