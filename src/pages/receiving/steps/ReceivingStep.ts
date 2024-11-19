import { expect, Page } from '@playwright/test';

import AlertPopup from '@/components/AlertPopup';
import BasePageModel from '@/pages/BasePageModel';
import EditModal from '@/pages/receiving/components/EditModal';
import ReceivingTable from '@/pages/receiving/components/ReceivingTable';

class ReceivingStep extends BasePageModel {
  table: ReceivingTable;

  editModal: EditModal;

  updateExpiryDatePopup: AlertPopup;

  constructor(page: Page) {
    super(page);
    this.table = new ReceivingTable(page);
    this.editModal = new EditModal(page);
    this.updateExpiryDatePopup = new AlertPopup(page, 'Yes', 'No');
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
