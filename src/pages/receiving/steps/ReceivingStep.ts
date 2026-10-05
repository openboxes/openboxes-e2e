import { expect, Page } from '@playwright/test';

import FileHandler from '@/components/FileHandler';
import NewAlertPopup from '@/components/NewAlertPopup';
import { PARTIAL_RECEIVING_API_PATTERN } from '@/constants/apiUrls';
import BasePageModel from '@/pages/BasePageModel';
import AutosaveStatus from '@/pages/receiving/components/AutosaveStatus';
import EditModal from '@/pages/receiving/components/EditModal';
import ReceivingTable from '@/pages/receiving/components/ReceivingTable';

class ReceivingStep extends BasePageModel {
  table: ReceivingTable;

  editModal: EditModal;

  updateExpiryDatePopup: NewAlertPopup;
  fileHandler: FileHandler;
  autosaveStatus: AutosaveStatus;

  constructor(page: Page) {
    super(page);
    this.table = new ReceivingTable(page);
    this.editModal = new EditModal(page);
    this.updateExpiryDatePopup = new NewAlertPopup(page);
    this.fileHandler = new FileHandler(page);
    this.autosaveStatus = new AutosaveStatus(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
    await expect(this.table.table.getByText('Loading...')).toBeHidden({
      timeout: 20_000,
    });
  }

  async waitForData() {
    await this.page.waitForResponse(PARTIAL_RECEIVING_API_PATTERN);
  }

  get autofillQuantitiesButton() {
    return this.page.getByRole('button', { name: 'Autofill quantities' });
  }

  get confirmReceivingDialog() {
    return this.page.getByTestId('zero-lines-confirm-modal');
  }

  get rejectConfirmReceivingDialog() {
    return this.confirmReceivingDialog.getByRole('button', { name: 'No' });
  }

  get acceptConfirmReceivingDialog() {
    return this.confirmReceivingDialog.getByRole('button', { name: 'Yes' });
  }

  get saveAndExitButton() {
    return this.page.getByRole('button', { name: 'Save & Exit' });
  }

  get exportTemplateButton() {
    return this.page.getByRole('button').getByText('Export template');
  }

  get importTemplateButton() {
    return this.page
      .locator('[class="btn btn-outline-secondary btn-xs mr-3"]')
      .getByText('Import template');
  }

  async downloadExportTemplate() {
    await this.fileHandler.onDownload();
    await this.exportTemplateButton.click();
    return await this.fileHandler.saveFile();
  }

  async uploadFile(path: string) {
    await this.fileHandler.onFileChooser();
    await this.importTemplateButton.click();
    return await this.fileHandler.uploadFile(path);
  }

  get validationOnEditFieldsThroughImport() {
    return this.page
      .locator('.s-alert-box-inner')
      .getByText(
        'You can only import the Receiving Now and the Comment fields. To make other changes, please use the edit line feature. You can then export and import the template again.'
      );
  }

  get orderSelect() {
    return this.page.getByTestId('custom-select-ordering');
  }

  getOrder(order: string) {
    return this.page
      .getByTestId('custom-select-dropdown-menu')
      .getByRole('listitem')
      .getByText(order, { exact: true });
  }
}

export default ReceivingStep;
