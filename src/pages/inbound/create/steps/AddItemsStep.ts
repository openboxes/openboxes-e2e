import { Page } from '@playwright/test';

import AlertPopup from '@/components/AlertPopup';
import FileHandler from '@/components/FileHandler';
import { expect, test } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';
import AddItemsTable from '@/pages/inbound/create/components/AddItemsTable';
import { CreateInboundAddItemsTableEntity } from '@/types';

class AddItemsStep extends BasePageModel {
  table: AddItemsTable;
  fileHandler: FileHandler;
  confirmReloadPopup: AlertPopup;

  constructor(page: Page) {
    super(page);
    this.table = new AddItemsTable(page);
    this.fileHandler = new FileHandler(page);
    this.confirmReloadPopup = new AlertPopup(
      page,
      'Confirm refresh',
      'Are you sure you want to refresh? Your progress since last save will be lost.'
    );
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

  async addItems(items: CreateInboundAddItemsTableEntity[]) {
    for (let i = 0; i < items.length; i++) {
      const rowValues = items[i];
      await test.step(`Add items to row ${i + 1}`, async () => {
        await this.table.row(i).fillRowValues(rowValues);
      });

      if (i !== items.length - 1) {
        await this.addLineButton.click();
      }
    }
  }

  async assertTableRows(items: CreateInboundAddItemsTableEntity[]) {
    for (let i = 0; i < items.length; i++) {
      const rowValues = items[i];
      await test.step(`Assert items on row ${i + 1}`, async () => {
        await this.table.row(i).assertRowValues(rowValues);
      });
    }
  }

  async waitForNetworkIdle() {
    // eslint-disable-next-line playwright/no-networkidle
    await this.page.waitForLoadState('networkidle');
  }
}

export default AddItemsStep;
