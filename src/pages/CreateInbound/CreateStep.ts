import { expect, Page } from '@playwright/test';

import DatePickerComponent from '@/components/DatePickerComponent';
import SelectComponent from '@/components/SelectComponent';
import BasePageModel from '@/pages/BasePageModel';

class CreateStep extends BasePageModel {
  originSelect: SelectComponent;
  destinationSelect: SelectComponent;
  requestedBySelect: SelectComponent;
  stocklistSelect: SelectComponent;
  dateRequestedDatePicker: DatePickerComponent;

  constructor(page: Page) {
    super(page);
    this.originSelect = new SelectComponent(page, 'Origin');
    this.destinationSelect = new SelectComponent(page, 'Destination');
    this.requestedBySelect = new SelectComponent(page, 'Requested by');
    this.stocklistSelect = new SelectComponent(page, 'Stocklist');
    this.dateRequestedDatePicker = new DatePickerComponent(
      page,
      'Date requested'
    );
  }

  get descriptionField() {
    return this.page.getByRole('textbox', { name: 'Description' });
  }

  get selectDropdown() {
    return this.page.getByTestId('custom-select-dropdown-menu');
  }

  getSelectOption(name: string) {
    return this.selectDropdown.getByRole('listitem').filter({ hasText: name });
  }

  async isLoaded() {
    await expect(this.descriptionField).toBeVisible();
    await expect(this.originSelect.selectField).toBeVisible();
    await expect(this.destinationSelect.selectField).toBeVisible();
    await expect(this.requestedBySelect.selectField).toBeVisible();
    await expect(this.stocklistSelect.selectField).toBeVisible();
    await expect(this.dateRequestedDatePicker.dateInputField).toBeVisible();
  }
}

export default CreateStep;
