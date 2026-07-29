import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class AssignToRecountDialog extends BasePageModel {
  async isLoaded() {
    await expect(this.title).toBeVisible();
  }

  get title() {
    return this.page.getByText('Assign products to recount', {
      exact: true,
    });
  }

  get closeButton() {
    return this.page.getByRole('button', { name: 'Close modal' });
  }

  get skipButton() {
    return this.page.getByRole('button', { name: 'Skip', exact: true });
  }

  get assignButton() {
    return this.page.getByRole('button', { name: 'Assign', exact: true });
  }

  get table() {
    return this.page.getByRole('grid');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get product() {
    return this.row.getByRole('link');
  }
}

export default AssignToRecountDialog;
