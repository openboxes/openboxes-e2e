import { expect } from '@playwright/test';

import FormField from '@/components/FormField';

class Select extends FormField {
  get selectDropdown() {
    return this.page.getByTestId('custom-select-dropdown-menu');
  }

  getSelectOption(name: string) {
    return this.selectDropdown.getByRole('listitem').filter({ hasText: name });
  }

  get selectField() {
    return this.field.getByTestId('custom-select-element');
  }

  get clearButton() {
    return this.selectField.locator('.filter-select__clear-indicator')
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

  async assertDisabled() {
    await this.click();
    await expect(this.selectDropdown).toBeHidden();
  }
}

export default Select;
