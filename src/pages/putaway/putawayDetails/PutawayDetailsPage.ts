import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import ItemStatusTable from './components/ItemStatusTable';
import OrderHeaderTable from './components/OrderHeaderTable';
import SummaryTable from './components/SummaryTable';

class PutawayDetailsPage extends BasePageModel {
  summaryTable: SummaryTable;
  orderHeaderTable: OrderHeaderTable;
  itemStatusTable: ItemStatusTable;

  constructor(page: Page) {
    super(page);
    this.summaryTable = new SummaryTable(page);
    this.orderHeaderTable = new OrderHeaderTable(page);
    this.itemStatusTable = new ItemStatusTable(page);
  }

  async isLoaded() {
    await expect(this.summary).toBeVisible();
  }

  get summary() {
    return this.page.locator('#order-summary');
  }

  get summaryActionsButton() {
    return this.summary.getByRole('button');
  }

  get actionsViewOrderDetailsButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'View order details' });
  }

  get actionsAddCommentButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'Add comment' });
  }

  get actionsAddDocumentsButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'Add document' });
  }

  get actionsGeneratePutawayListButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'Generate Putaway List' });
  }

  get actionsDeleteButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'Delete Order' });
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

  get createOrderButton() {
    return this.page.getByRole('link', { name: 'Create Order' });
  }

  get showOrderButton() {
    return this.page.getByRole('link', { name: 'Show Order' });
  }

  get editButton() {
    return this.page.getByRole('link', { name: 'Edit Putaway' });
  }

  get addCommentButton() {
    return this.page.getByRole('link', { name: 'Add comment' });
  }

  get addDocumentButton() {
    return this.page.getByRole('link', { name: 'Add document' });
  }

  get generatePutawayListButton() {
    return this.page.getByRole('link', { name: 'Generate Putaway List' });
  }
}

export default PutawayDetailsPage;
