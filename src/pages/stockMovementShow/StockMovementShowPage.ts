import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import AuditingTable from '@/pages/stockMovementShow/components/AuditingTable';
import PackingListTable from '@/pages/stockMovementShow/components/PackingListTable';

class StockMovementShowPage extends BasePageModel {
  auditingTable: AuditingTable;
  packingListTable: PackingListTable;

  constructor(page: Page) {
    super(page);
    this.auditingTable = new AuditingTable(page);
    this.packingListTable = new PackingListTable(page);
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
}

export default StockMovementShowPage;
