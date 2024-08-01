import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import ReceivingTable from '@/pages/receiving/components/ReceivingTable';

class ReceivingStep extends BasePageModel {
  table: ReceivingTable;

  constructor(page: Page) {
    super(page);
    this.table = new ReceivingTable(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
  }

  async waitForData() {
    await this.page.waitForResponse('./api/partialReceiving/**');
  }
}

export default ReceivingStep;
