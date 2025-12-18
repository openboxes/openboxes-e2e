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

  async hasError() {
    return (
      (await this.field.getAttribute('class'))?.includes('has-error') ||
      (await this.field.getAttribute('data-testid'))?.includes('has-errors')
    );
  }

  get fieldWithError() {
    return this.root.locator(
      `div[data-testid="form-field has-errors"][aria-label="${this.fieldName}"]`
    );
  }

  get field() {
    return this.root.locator(
      `div[data-testid^="form-field"][aria-label="${this.fieldName}"]`
    );
  }

  get errorMessage() {
    return this.field.getByLabel('subtext');
  }

  get tooltip() {
    return this.page.locator('.tippy-tooltip-content');
  }

  async assertHasError() {
    expect(await this.hasError()).toBeTruthy();
  }

  async assertFieldWithErrorIsVisible(error: string) {
    await expect(this.fieldWithError).toContainText(error);
  }

  async assertHasNoError() {
    expect(await this.hasError()).toBeFalsy();
  }
}

export default FormField;
