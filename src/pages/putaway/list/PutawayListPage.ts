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
}

export default PutawayListPage;
