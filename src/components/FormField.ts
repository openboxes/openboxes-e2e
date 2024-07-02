import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class FormField extends BasePageModel {
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

  get errorMessage() {
    return this.field.getByLabel('subtext');
  }

  get tooltip() {
    return this.page.getByRole('tooltip');
  }

  async assertHasError() {
    await expect(this.field).toHaveClass(/has-error/);
  }

  async assertHasNoError() {
    await expect(this.field).not.toHaveClass(/has-error/);
  }
}

export default FormField;
