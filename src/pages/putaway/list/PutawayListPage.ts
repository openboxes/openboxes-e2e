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
    return this.page.getByTestId('filters');
  }

  get searchField() {
    return this.filters.getByTestId('search-input');
  }

  get orderTypeFilter() {
    return this.filters.getByTestId('order-type-select');
  }

  get statusFilter() {
    return this.filters.locator('#select2-status-container');
  }

  getStatus(status: string) {
    return this.page
      .locator('.select2-results__option', {
        hasText: status,
      })
      .click();
  }

  get destinationFilter() {
    return this.filters.getByTestId('destination-select');
  }

  get orderedByFilter() {
    return this.filters.locator('#select2-orderedBy-container');
  }

  get orderedByTextInput() {
    return this.page.locator('.select2-search__field');
  }

  getOrderedBy(user: string) {
    return this.page
      .locator('.select2-results__option', {
        hasText: user,
      })
      .click();
  }

  get createdByFilter() {
    return this.filters.locator('#select2-createdBy-container');
  }

  get createdByTextInput() {
    return this.page.locator('.select2-search__field');
  }

  getCreatedBy(user: string) {
    return this.page
      .locator('.select2-results__option', {
        hasText: user,
      })
      .click();
  }

  get searchButton() {
    return this.filters.getByTestId('search-button');
  }

  get clearFilteringButton() {
    return this.filters.getByTestId('cancel-button');
  }

  get emptyPutawayList() {
    return this.page.getByTestId('empty-table');
  }

  get nextButton() {
    return this.page.getByRole('link').getByText('Next');
  }
}

export default PutawayListPage;
