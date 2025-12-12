import { expect, Page } from '@playwright/test';

import AlertPopup from '@/components/AlertPopup';
import DatePicker from '@/components/DatePicker';
import FileHandler from '@/components/FileHandler';
import Select from '@/components/Select';
import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';
import SendPageTable from '@/pages/inbound/create/components/SendPageTable';

class SendStep extends BasePageModel {
  table: SendPageTable;

  destinationSelect: Select;
  shipmentTypeSelect: Select;
  shipDateDatePicker: DatePicker;
  expectedDeliveryDatePicker: DatePicker;
  originField: Select;
  trackingNumberField: TextField;
  driverNameField: TextField;
  commentField: TextField;

  validationPopup: AlertPopup;
  fileHandler: FileHandler;

  constructor(page: Page) {
    super(page);
    this.table = new SendPageTable(page);

    this.destinationSelect = new Select(page, 'Destination');
    this.shipmentTypeSelect = new Select(page, 'Shipment type');
    this.shipDateDatePicker = new DatePicker(page, 'Ship date');
    this.expectedDeliveryDatePicker = new DatePicker(
      page,
      'Expected Delivery Date'
    );
    this.originField = new Select(page, 'Origin');
    this.trackingNumberField = new TextField(page, 'Tracking Number');
    this.driverNameField = new TextField(page, 'Driver Name');
    this.commentField = new TextField(page, 'Comments');

    this.validationPopup = new AlertPopup(
      page,
      'Continue (lose unsaved work)',
      'Correct error'
    );
    this.fileHandler = new FileHandler(page);
  }

  get sendShipmentButton() {
    return this.page.getByRole('button', { name: 'Send shipment' });
  }

  get saveAndExitButton() {
    return this.page.getByRole('button', { name: 'Save and Exit' });
  }

  get acceptConfirmExitDialog() {
    return this.page.getByRole('button', { name: 'Yes' });
  }

  get downloadButton() {
    return this.page.getByRole('button', { name: 'Download' });
  }

  getDocuments(documentName: string) {
    return this.page
      .locator('.dropdown-item')
      .getByText(documentName, { exact: true });
  }

  async isLoaded() {
    await expect(this.originField.selectField).toBeVisible();
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
