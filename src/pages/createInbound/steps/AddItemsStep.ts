import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import AddItemsTable from '@/pages/createInbound/components/AddItemsTable';

class AddItemsStep extends BasePageModel {
  table: AddItemsTable;

  constructor(page: Page) {
    super(page);
    this.table = new AddItemsTable(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
  }

  async waitForData() {
    await this.page.waitForResponse(
      /\/api\/stockMovements\/.*\/stockMovementItems/
    );
  }

  get addLineButton() {
    return this.page.getByRole('button', { name: 'Add line' });
  }

  get importTemplateButton() {
    return this.page.getByRole('button', { name: 'Import template' });
  }

  get exportTemplateButton() {
    return this.page.getByRole('button', { name: 'Export template' });
  }

  get reloadButton() {
    return this.page.getByRole('button', { name: 'Reload' });
  }

  get saveButton() {
    return this.page
      .getByRole('button', { name: 'Save' })
      .filter({ hasNotText: 'exit' });
  }

  get saveAndExitButton() {
    return this.page.getByRole('button', { name: 'Save and exit' });
  }

  get deleteAllButton() {
    return this.page.getByRole('button', { name: 'Delete All' });
  }
}

export default AddItemsStep;
