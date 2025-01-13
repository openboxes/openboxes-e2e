import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import AuditingTable from '@/pages/stockMovementShow/components/AuditingTable';
import PackingListTable from '@/pages/stockMovementShow/components/PackingListTable';
import ReceiptsListTable from './components/ReceiptsTable';

class StockMovementShowPage extends BasePageModel {
  auditingTable: AuditingTable;
  packingListTable: PackingListTable;
  receiptListTable: ReceiptsListTable;

  constructor(page: Page) {
    super(page);
    this.auditingTable = new AuditingTable(page);
    this.packingListTable = new PackingListTable(page);
    this.receiptListTable = new ReceiptsListTable(page);
  }

  async goToPage(id: string) {
    await this.page.goto(`./stockMovement/show/${id}`);
  }

  async waitForUrl() {
    await this.page.waitForURL('**/stockMovement/show/**');
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

  async clickDeleteShipment() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteButton.click();
  }
}

export default StockMovementShowPage;
