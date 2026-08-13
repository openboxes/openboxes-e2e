import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import RecountStepTable from '@/pages/manageCycleCount/components/RecountStepTable';

class RecountStepPage extends BasePageModel {
  recountStepTable: RecountStepTable;

  constructor(page: Page) {
    super(page);
    this.recountStepTable = new RecountStepTable(page);
  }

  async isLoaded() {
    await expect(this.productTitle).toBeVisible();
  }

  get productTitle() {
    return this.page.locator('.count-step-title');
  }

  get dateCountedValue() {
    return this.page
      .locator('.count-step-label', { hasText: 'Date counted' })
      .locator('.count-step-value');
  }

  get countedByValue() {
    return this.page
      .locator('.count-step-label', { hasText: /^Counted by/ })
      .locator('.count-step-value');
  }

  get dateRecountedValue() {
    return this.page.locator(
      '.date-counted-date-picker .date-field-input__value'
    );
  }

  get recountedBySelectedValue() {
    return this.page
      .locator('.header-container', { hasText: 'Recounted by' })
      .locator('.react-select__single-value');
  }

  get nextButton() {
    return this.page.getByRole('button', { name: 'Next', exact: true });
  }

  get emptyRootCauseAlert() {
    return this.page
      .locator('.s-alert-box-inner')
      .getByText('Are you sure you want to continue with empty root cause?');
  }

  async closeAlert() {
    await this.page.locator('.alert-close-icon').first().click();
  }
}

export default RecountStepPage;
