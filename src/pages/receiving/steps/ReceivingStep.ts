import { expect, Page } from '@playwright/test';

import AlertPopup from '@/components/AlertPopup';
import FileHandler from '@/components/FileHandler';
import BasePageModel from '@/pages/BasePageModel';
import EditModal from '@/pages/receiving/components/EditModal';
import ReceivingTable from '@/pages/receiving/components/ReceivingTable';

class ReceivingStep extends BasePageModel {
  table: ReceivingTable;

  editModal: EditModal;

  updateExpiryDatePopup: AlertPopup;
  fileHandler: FileHandler;

  constructor(page: Page) {
    super(page);
    this.table = new ReceivingTable(page);
    this.editModal = new EditModal(page);
    this.updateExpiryDatePopup = new AlertPopup(page, 'Yes', 'No');
    this.fileHandler = new FileHandler(page);
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

  get confirmReceivingDialog() {
    return this.page.locator('.react-confirm-alert-body');
  }

  get rejectConfirmReceivingDialog() {
    return this.confirmReceivingDialog.getByRole('button', { name: 'No' });
  }

  get acceptConfirmReceivingDialog() {
    return this.confirmReceivingDialog.getByRole('button', { name: 'Yes' });
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  get saveAndExitButton() {
    return this.page.getByRole('button').getByText('Save and Exit');
  }

  get exportTemplateButton() {
    return this.page.getByRole('button').getByText('Export template');
  }

  async downloadExportTemplate() {
    await this.fileHandler.onDownload();
    await this.exportTemplateButton.click();
    return await this.fileHandler.saveFile();
  }
}

export default ReceivingStep;
