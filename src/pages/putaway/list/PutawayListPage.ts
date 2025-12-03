import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import PutawayListTable from './PutawayListTable';

class PutawayListPage extends BasePageModel {
  table: PutawayListTable;

  constructor(page: Page) {
    super(page);

    this.table = new PutawayListTable(page);
  }

  async goToPage(status = 'PENDING') {
    await this.page.goto(
      './order/list?orderType=PUTAWAY_ORDER&status=' + `${status}`
    );
  }

  async isLoaded() {
    await expect(
      this.page.getByRole('heading').getByText('List Putaways')
    ).toBeVisible();
  }

  get filters() {
    return this.page.locator('.box');
  }

  get searchField() {
    return this.filters
      .locator('.filter-list-item')
      .getByTestId('search-input');
  }

  get orderTypeFilter() {
    return this.filters
      .locator('.filter-list-item')
      .getByTestId('order-type-select');
  }

  get statusFilter() {
    return this.filters
      .locator('.filter-list-item')
      .getByTestId('status.select');
  }

  get destinationFilter() {
    return this.filters
      .locator('.filter-list-item')
      .getByTestId('destination-select');
  }

  get searchButton() {
    return this.filters.getByTestId('search-button');
  }

  get clearFilteringButton() {
    return this.filters.getByTestId('cancel-button');
  }
}

export default PutawayListPage;
