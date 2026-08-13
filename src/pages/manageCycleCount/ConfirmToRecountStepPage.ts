import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import ConfirmToRecountTable from '@/pages/manageCycleCount/components/ConfirmToRecountTable';

class ConfirmToRecountStepPage extends BasePageModel {
  confirmToRecountTable: ConfirmToRecountTable;

  constructor(page: Page) {
    super(page);
    this.confirmToRecountTable = new ConfirmToRecountTable(page);
  }

  async isLoaded() {
    await expect(this.saveButton).toBeVisible();
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
    return this.page
      .locator('.count-step-label', { hasText: 'Date recounted' })
      .locator('.count-step-value');
  }

  get recountedByValue() {
    return this.page
      .locator('.count-step-label', { hasText: 'Recounted by' })
      .locator('.count-step-value');
  }

  get backButton() {
    return this.page.getByRole('button', { name: 'Back', exact: true });
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }
}

export default ConfirmToRecountStepPage;
