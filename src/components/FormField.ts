import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

abstract class FormField extends BasePageModel {
  private fieldName: string;
  private root: Locator;

  constructor(page: Page, fieldName: string, root?: Locator) {
    super(page);
    this.fieldName = fieldName;
    this.root = root ?? this.page.locator('body');
  }

  get field() {
    return this.root.locator(
      `[data-testid="form-field"][aria-label="${this.fieldName}"]`
    );
  }
}

export default FormField;
