import { Page } from '@playwright/test';

import FileHandler from '@/components/FileHandler';
import { STOCK_MOVEMENT_API_PATTERN } from '@/consts/apiUrls';
import { STOCK_MOVEMENT_URL } from '@/consts/applicationUrls';
import BasePageModel from '@/pages/BasePageModel';
import InboundListFilters from '@/pages/inbound/list/InboundListFilters';
import InboundStockMovementTable from '@/pages/inbound/list/InboundStockMovementTable';

class InboundListPage extends BasePageModel {
  filters: InboundListFilters;
  table: InboundStockMovementTable;
  fileHandler: FileHandler;

  constructor(page: Page) {
    super(page);
    this.filters = new InboundListFilters(page);
    this.table = new InboundStockMovementTable(page);
    this.fileHandler = new FileHandler(page);
  }

  get exportDropdownButton() {
    return this.page.getByRole('button', { name: 'Export' });
  }

  get exportAllIncomingItemsButton() {
    return this.page.getByRole('link', { name: 'Export all incoming items' });
  }

  get exportStockMovementsButton() {
    return this.page.getByRole('button', { name: 'Export Stock Movements' });
  }

  get myStockMovementsButton() {
    return this.page.getByRole('button', { name: 'My Stock Movements' });
  }

  async goToPage() {
    await this.page.goto(STOCK_MOVEMENT_URL.listInbound());
  }

  async waitForUrl() {
    await this.page.waitForURL(STOCK_MOVEMENT_URL.listPattern);
  }

  async waitForResponse() {
    await this.page.waitForResponse(STOCK_MOVEMENT_API_PATTERN);
  }

  async search() {
    await Promise.all([
      this.waitForResponse(),
      this.filters.searchButton.click(),
    ]);
  }

  async clear() {
    await Promise.all([
      this.waitForResponse(),
      this.filters.clearButton.click(),
    ]);
  }

  async downloadAllIncomingItems() {
    await this.fileHandler.onDownload();
    await this.exportDropdownButton.click();
    await this.exportAllIncomingItemsButton.click();
    return await this.fileHandler.saveFile();
  }

  async exportStockMovements() {
    await this.fileHandler.onDownload();
    await this.exportDropdownButton.click();
    await this.exportStockMovementsButton.click();
    return await this.fileHandler.saveFile();
  }

  async waitForNetworkIdle() {
    // eslint-disable-next-line playwright/no-networkidle
    await this.page.waitForLoadState('networkidle');
  }
}

export default InboundListPage;
