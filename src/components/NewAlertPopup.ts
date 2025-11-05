import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class NewAlertPopup extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get tableDialog() {
    return this.page.getByTestId('modal-with-table');
  }

  get yesButton() {
    return this.tableDialog.getByRole('button', { name: 'Yes' });
  }

  get noButton() {
    return this.tableDialog.getByRole('button', { name: 'No' });
  }
}

export default NewAlertPopup;
