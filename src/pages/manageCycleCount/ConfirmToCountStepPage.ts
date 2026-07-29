import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import AssignToRecountDialog from '@/pages/manageCycleCount/components/AssignToRecountDialog';
import ConfirmToCountTable from '@/pages/manageCycleCount/components/ConfirmToCountTable';
import ResolveDiscrepancyDialog from '@/pages/manageCycleCount/components/ResolveDiscrepancyDialog';

class ConfirmToCountStepPage extends BasePageModel {
  confirmToCountTable: ConfirmToCountTable;
  resolveDiscrepancyDialog: ResolveDiscrepancyDialog;
  assignToRecountDialog: AssignToRecountDialog;

  constructor(page: Page) {
    super(page);
    this.confirmToCountTable = new ConfirmToCountTable(page);
    this.resolveDiscrepancyDialog = new ResolveDiscrepancyDialog(page);
    this.assignToRecountDialog = new AssignToRecountDialog(page);
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
      .locator('.count-step-label', { hasText: 'Counted by' })
      .locator('.count-step-value');
  }

  get backButton() {
    return this.page.getByRole('button', { name: 'Back', exact: true });
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }
}

export default ConfirmToCountStepPage;
