import { INVOICE_URL } from '@/consts/applicationUrls';
import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class CreateInvoicePage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Vendor Invoice Number')).toBeVisible();
  }

  async goToPage() {
    await this.page.goto(INVOICE_URL.create());
  }
}

export default CreateInvoicePage;
