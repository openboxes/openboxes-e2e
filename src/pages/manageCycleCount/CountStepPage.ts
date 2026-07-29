import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import CountStepTable from '@/pages/manageCycleCount/components/CountStepTable';

class CountStepPage extends BasePageModel {
  countStepTable: CountStepTable;

  constructor(page: Page) {
    super(page);
    this.countStepTable = new CountStepTable(page);
  }

  async isLoaded() {
    await expect(this.productTitle).toBeVisible();
  }

  get productTitle() {
    return this.page.locator('.count-step-title');
  }

  get backToListButton() {
    return this.page.getByText('Back to Cycle Count List');
  }

  get dateCountedValue() {
    return this.page.locator(
      '.date-counted-date-picker .date-field-input__value'
    );
  }

  get countedBySelectedValue() {
    return this.page
      .locator('.header-container', { hasText: 'Counted by' })
      .locator('.react-select__single-value');
  }

  get printCountFormButton() {
    return this.page.getByRole('button', { name: 'Print Count form' });
  }

  get sortAlphabeticallyButton() {
    return this.page.getByRole('button', { name: 'Sort alphabetically' });
  }

  get saveProgressButton() {
    return this.page.getByRole('button', { name: 'Save progress' });
  }

  get nextButton() {
    return this.page.getByRole('button', { name: 'Next', exact: true });
  }

  get addNewRecordButton() {
    return this.page.getByRole('button', { name: 'Add new record' });
  }
}

export default CountStepPage;
