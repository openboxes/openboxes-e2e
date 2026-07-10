import { expect, Locator, Page } from '@playwright/test';

import { STOCK_MOVEMENT_URL } from '@/constants/applicationUrls';
import BasePageModel from '@/pages/BasePageModel';
import AuditingTable from '@/pages/stockMovementShow/components/AuditingTable';
import PackingListTable from '@/pages/stockMovementShow/components/PackingListTable';

import DetailsTable from './components/DetailsTable';
import DocumentsListTable from './components/DocumentsTable';
import ReceiptsListTable from './components/ReceiptsTable';

class StockMovementShowPage extends BasePageModel {
  auditingTable: AuditingTable;
  packingListTable: PackingListTable;
  receiptListTable: ReceiptsListTable;
  detailsListTable: DetailsTable;
  documentsListTable: DocumentsListTable;

  constructor(page: Page) {
    super(page);
    this.auditingTable = new AuditingTable(page);
    this.packingListTable = new PackingListTable(page);
    this.receiptListTable = new ReceiptsListTable(page);
    this.detailsListTable = new DetailsTable(page);
    this.documentsListTable = new DocumentsListTable(page);
  }

  async goToPage(id: string) {
    await this.page.goto(STOCK_MOVEMENT_URL.show(id));
  }

  async waitForUrl() {
    await this.page.waitForURL(STOCK_MOVEMENT_URL.showPattern);
  }

  async isLoaded() {
    await expect(this.summary).toBeVisible();
  }

  get summary() {
    return this.page.getByRole('region', { name: 'Summary' });
  }

  get statusTag() {
    return this.summary.getByTestId('status-tag');
  }

  get title() {
    return this.summary.getByTestId('title');
  }

  // TABS
  get packingListTab() {
    return this.page.getByRole('tab', { name: 'Packing List' });
  }

  get receiptTab() {
    return this.page.getByRole('tab', { name: 'Receipt' });
  }

  get emptyReceiptTab() {
    return this.page.getByText('Shipment has not been received yet');
  }

  get documentTab() {
    return this.page.getByRole('tab', { name: 'Documents' });
  }

  // BUTTONS
  get listButton() {
    return this.page.getByRole('link', { name: 'List' });
  }

  get createButton() {
    return this.page.getByRole('link', { name: 'Create' });
  }

  get editButton() {
    return this.page.getByRole('link', { name: 'Edit' });
  }

  get rollbackButton() {
    return this.page.getByRole('link', { name: 'Rollback' });
  }

  get rollbackLastReceiptButton() {
    return this.page.getByRole('link', { name: 'Rollback Last Receipt' });
  }

  get receiveButton() {
    return this.page.getByRole('link', { name: 'Receive' });
  }

  get deleteButton() {
    return this.page.getByRole('link', { name: 'Delete' });
  }

  get synchronizeButton() {
    return this.page.getByRole('link', { name: 'Synchronize' });
  }

  get errorMessage() {
    return this.page.locator('div.error');
  }

  get rollbackReceiptInformationMessage() {
    return this.page.getByRole('status', { name: 'message' });
  }

  async clickDeleteShipment() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteButton.click();
  }

  // tab content is fetched once per page load, so when it fails to render,
  // re-clicking the tab never refetches it — only a reload does
  private async openTab(
    tab: Locator,
    tabContent: { isLoaded: () => Promise<void> }
  ) {
    let reloadOnRetry = false;
    await expect(async () => {
      if (reloadOnRetry) {
        await this.page.reload();
      }
      reloadOnRetry = true;
      await tab.click();
      await tabContent.isLoaded();
    }).toPass({ timeout: 45000, intervals: [500, 1000, 2000] });
  }

  async openReceiptsTab() {
    await this.openTab(this.receiptTab, this.receiptListTable);
  }

  async openDocumentsTab() {
    await this.openTab(this.documentTab, this.documentsListTable);
  }
}

export default StockMovementShowPage;
