import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class DatePickerComponent extends BasePageModel {
  private fieldName: string;

  constructor(page: Page, fieldName: string) {
    super(page);
    this.fieldName = fieldName;
  }

  get datePickerPopup() {
    return this.page.locator('.react-datepicker');
  }

  get dateInputField() {
    return this.page
      .locator(`[data-testid="form-field"][aria-label="${this.fieldName}"]`)
      .getByRole('textbox')
  }

  async fill(date: Date) {
    const formatedDate = new Intl.DateTimeFormat('en-US').format(date)
    await this.dateInputField.fill(formatedDate);
    await this.page.keyboard.press('Enter');
  }
}

export default DatePickerComponent;
