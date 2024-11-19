import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import RecordStockSection from '@/pages/product/productShow/sections/RecordStockSection';

class ProductShowPage extends BasePageModel {
  recordStock: RecordStockSection;

  constructor(page: Page) {
    super(page);
    this.recordStock = new RecordStockSection(page);
  }

  async goToPage(id: string) {
    await this.page.goto(`./inventoryItem/showStockCard/${id}`);
  }

  get showStockCardButton() {
    return this.page.getByRole('link', { name: 'Show stock card' });
  }

  get recordStockButton() {
    return this.page.getByRole('link', { name: 'Record stock' });
  }
}

export default ProductShowPage;
