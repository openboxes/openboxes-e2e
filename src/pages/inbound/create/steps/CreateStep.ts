import { expect, Page } from '@playwright/test';

import DatePicker from '@/components/DatePicker';
import Select from '@/components/Select';
import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class CreateStep extends BasePageModel {
  descriptionField: TextField;
  originSelect: Select;
  destinationSelect: Select;
  requestedBySelect: Select;
  stocklistSelect: Select;
  dateRequestedDatePicker: DatePicker;

  constructor(page: Page) {
    super(page);
    this.descriptionField = new TextField(page, 'Description');
    this.originSelect = new Select(page, 'Origin');
    this.destinationSelect = new Select(page, 'Destination');
    this.requestedBySelect = new Select(page, 'Requested By');
    this.stocklistSelect = new Select(page, 'Stocklist');
    this.dateRequestedDatePicker = new DatePicker(page, 'Date Requested');
  }

  async isLoaded() {
    await expect(this.descriptionField.field).toBeVisible();
    await expect(this.originSelect.selectField).toBeVisible();
    await expect(this.destinationSelect.selectField).toBeVisible();
    await expect(this.requestedBySelect.selectField).toBeVisible();
    await expect(this.stocklistSelect.selectField).toBeVisible();
    await expect(this.dateRequestedDatePicker.field).toBeVisible();
  }
}

export default CreateStep;
