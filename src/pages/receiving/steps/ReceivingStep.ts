import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import EditModal from '@/pages/receiving/components/EditModal';
import ReceivingTable from '@/pages/receiving/components/ReceivingTable';

class ReceivingStep extends BasePageModel {
  table: ReceivingTable;

  editModal: EditModal;

  constructor(page: Page) {
    super(page);
    this.table = new ReceivingTable(page);
    this.editModal = new EditModal(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
  }

  async waitForData() {
    await this.page.waitForResponse('./api/partialReceiving/**');
  }

  get autofillQuantitiesButton() {
    return this.page.getByRole('button', { name: 'Autofill quantities' });
  }
}

export default ReceivingStep;
