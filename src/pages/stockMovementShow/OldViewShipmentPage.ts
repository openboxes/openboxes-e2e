import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class OldViewShipmentPage extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get undoStatusChangeButton() {
    return this.page.getByRole('link', { name: 'Undo status change' });
  }
}

export default OldViewShipmentPage;
