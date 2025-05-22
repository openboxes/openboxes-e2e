import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class AlertPopup extends BasePageModel {
  private confirmLabel: string;
  private cancelLabel: string;

  constructor(page: Page, confirmLabel: string, cancelLabel: string) {
    super(page);
    this.confirmLabel = confirmLabel;
    this.cancelLabel = cancelLabel;
  }

  get dialog() {
    return this.page.locator('#react-confirm-alert .react-confirm-alert');
  }

  get confirmButton() {
    return this.dialog.getByRole('button', { name: this.confirmLabel });
  }

  get cancelButton() {
    return this.dialog.getByRole('button', { name: this.cancelLabel });
  }

  get yesButton() {
    return this.dialog.getByRole('button', { name: 'Yes' });
  }

  get noButton() {
    return this.dialog.getByRole('button', { name: 'No' });
  }

  async assertPopupVisible() {
    await expect(this.dialog).toBeVisible();
  }

  async assertPopupHiddent() {
    await expect(this.dialog).toBeHidden();
  }
}

export default AlertPopup;
