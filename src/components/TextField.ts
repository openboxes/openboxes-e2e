import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class TextField extends BasePageModel {
  private fieldName: string;

  constructor(page: Page, fieldName: string) {
    super(page);
    this.fieldName = fieldName;
  }

  get field() {
    return this.page
      .locator(`[data-testid="form-field"][aria-label="${this.fieldName}"]`)
      .getByRole('textbox')
  }

}

export default TextField;
