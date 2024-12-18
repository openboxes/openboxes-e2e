import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class CreateInvoicePage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Vendor Invoice Number')).toBeVisible();
  }

  async goToPage() {
    await this.page.goto('./invoice/create');
  }
}

export default CreateInvoicePage;
