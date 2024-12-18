import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class InvoiceListPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('List Invoices')).toBeVisible();
  }

  async goToPage() {
    await this.page.goto('./invoice/list');
  }

  get invoiceListHeader() {
    return this.page.locator('.list-page-header').getByText('List Invoices');
  }
}

export default InvoiceListPage;
