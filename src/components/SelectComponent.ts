import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class SelectComponent extends BasePageModel {
  private fieldName: string;
  private root: Locator;

  constructor(page: Page, fieldName: string, root?: Locator) {
    super(page);
    this.fieldName = fieldName;
    this.root = root ?? this.page.locator('body')
  }

  get selectDropdown() {
    return this.page.getByTestId('custom-select-dropdown-menu');
  }

  getSelectOption(name: string) {
    return this.selectDropdown.getByRole('listitem').filter({ hasText: name });
  }

  get selectField() {
    return this.root
      .locator(`[data-testid="form-field"][aria-label="${this.fieldName}"]`)
      .getByTestId('custom-select-element');
  }

  async click() {
    await this.selectField.click();
  }

  async search(searchTerm: string) {
    await this.selectField.getByRole('textbox').fill(searchTerm);
  }

  async clickOption(searchTerm: string) {
    await this.getSelectOption(searchTerm).click();

    await expect(this.selectDropdown).toBeHidden();
    await expect(this.selectField).toContainText(searchTerm);
  }

  async findAndSelectOption(searchTerm: string) {
    await this.click();
    await this.search(searchTerm);
    await this.clickOption(searchTerm);
  }
}

export default SelectComponent;
