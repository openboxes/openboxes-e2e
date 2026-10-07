import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class NewAlertPopup extends BasePageModel {
  private confirmLabel: string;
  private cancelLabel: string;

  constructor(page: Page, confirmLabel = 'Yes', cancelLabel = 'No') {
    super(page);
    this.confirmLabel = confirmLabel;
    this.cancelLabel = cancelLabel;
  }

  get tableDialog() {
    return this.page.getByTestId('modal-with-table');
  }

  get confirmButton() {
    return this.tableDialog.getByRole('button', { name: this.confirmLabel });
  }

  get cancelButton() {
    return this.tableDialog.getByRole('button', { name: this.cancelLabel });
  }
}

export default NewAlertPopup;
