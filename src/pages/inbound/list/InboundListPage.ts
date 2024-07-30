import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import InboundListFilters from '@/pages/inbound/list/InboundListFilters';
import InboundStockMovementTable from '@/pages/inbound/list/InboundStockMovementTable';

class InboundListPage extends BasePageModel {
  filters: InboundListFilters;
  table: InboundStockMovementTable;

  constructor(page: Page) {
    super(page);
    this.filters = new InboundListFilters(page);
    this.table = new InboundStockMovementTable(page);
  }

  async goToPage() {
    await this.page.goto('./stockMovement/list?direction=INBOUND');
  }

  async waitForUrl() {
    await this.page.waitForURL('**/stockMovement/list**');
  }

  async waitForResponse() {
    await this.page.waitForResponse('./api/stockMovements?**');
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
}

export default InboundListPage;
