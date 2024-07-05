import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class FieldLabel extends BasePageModel {
  private fieldName: string;
  private root: Locator;

  constructor(page: Page, fieldName: string, root?: Locator) {
    super(page);
    this.fieldName = fieldName;
    this.root = root ?? this.page.locator('body');
  }

  get field() {
    return this.root.locator(
      `[data-testid="label-field"][aria-label="${this.fieldName}"]`
    );
  }
}

export default FieldLabel;
