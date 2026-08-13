import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class ResolveDiscrepancyDialog extends BasePageModel {
  async isLoaded() {
    await expect(this.title).toBeVisible();
  }

  get dialog() {
    return this.page.locator('.react-confirm-alert');
  }

  get title() {
    return this.dialog.locator('.custom-modal-title');
  }

  get text() {
    return this.dialog.locator('.custom-modal-text');
  }

  get notNowButton() {
    return this.dialog.getByRole('button', { name: 'Not now' });
  }

  get resolveButton() {
    return this.dialog.getByRole('button', { name: 'Resolve', exact: true });
  }
}

export default ResolveDiscrepancyDialog;
