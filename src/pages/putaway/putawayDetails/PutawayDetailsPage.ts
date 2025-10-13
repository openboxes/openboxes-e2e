import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import SummaryTable from './components/SummaryTable';

class PutawayDetailsPage extends BasePageModel {
  table: SummaryTable;
  constructor(page: Page) {
    super(page);
    this.table = new SummaryTable(page);
  }

  async isLoaded() {
    await expect(this.summary).toBeVisible();
  }

  get summary() {
    return this.page.locator('#order-summary');
  }

  get statusTag() {
    return this.summary.locator('.tag-alert');
  }

  // TABS
  get summaryTab() {
    return this.page.getByRole('link', { name: 'Summary' });
  }

  get itemStatusTab() {
    return this.page.getByRole('link', { name: 'Item Status' });
  }

  get itemDetailsTab() {
    return this.page.getByRole('link', { name: 'Item Status' });
  }

  get documentTab() {
    return this.page.getByRole('link', { name: 'Documents' });
  }

  get commentsTab() {
    return this.page.getByRole('link', { name: 'Comments' });
  }

  // BUTTONS
  get listOrdersButton() {
    return this.page.getByRole('link', { name: 'List Orders' });
  }

  get editButton() {
    return this.page.getByRole('button', { name: 'Edit Putaway' });
  }
}

export default PutawayDetailsPage;
