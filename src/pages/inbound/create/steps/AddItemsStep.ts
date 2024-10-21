import { expect, Page } from '@playwright/test';

import FileHandler from '@/components/FileHandler';
import BasePageModel from '@/pages/BasePageModel';
import AddItemsTable from '@/pages/inbound/create/components/AddItemsTable';

class AddItemsStep extends BasePageModel {
  table: AddItemsTable;
  fileHandler: FileHandler;

  constructor(page: Page) {
    super(page);
    this.table = new AddItemsTable(page);
    this.fileHandler = new FileHandler(page);
  }

  async isLoaded() {
    await expect(this.table.table).toBeVisible();
  }

  async waitForData() {
    await this.page.waitForResponse(
      /\/api\/stockMovements\/.*\/stockMovementItems/
    );
  }

  get addLineButton() {
    return this.page.getByRole('button', { name: 'Add line' });
  }

  get importTemplateButton() {
    return this.page.getByText('Import template');
  }

  get exportTemplateButton() {
    return this.page.getByRole('button', { name: 'Export template' });
  }

  get reloadButton() {
    return this.page.getByRole('button', { name: 'Reload' });
  }

  get saveButton() {
    return this.page
      .getByRole('button', { name: 'Save' })
      .filter({ hasNotText: 'exit' });
  }

  get saveAndExitButton() {
    return this.page.getByRole('button', { name: 'Save and exit' });
  }

  get deleteAllButton() {
    return this.page.getByRole('button', { name: 'Delete All' });
  }

  async downloadTemplate() {
    await this.fileHandler.onDownload();
    await this.exportTemplateButton.click();
    return await this.fileHandler.saveFile();
  }

  async uploadFile(path: string) {
    await this.fileHandler.onFileChooser();
    await this.importTemplateButton.click();
    return await this.fileHandler.uploadFile(path);
  }
}

export default AddItemsStep;
