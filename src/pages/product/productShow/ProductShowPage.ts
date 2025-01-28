import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import RecordStockSection from '@/pages/product/productShow/sections/RecordStockSection';
import InStockTabSection from './tabs/InStockTabSection';

class ProductShowPage extends BasePageModel {
  recordStock: RecordStockSection;
  inStockTabSection: InStockTabSection;

  constructor(page: Page) {
    super(page);
    this.recordStock = new RecordStockSection(page);
    this.inStockTabSection = new InStockTabSection(page);
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

  get inStockTab() {
    return this.page.getByRole('link', { name: 'In Stock' });
  }

  get stockHistoryTab() {
    return this.page.getByRole('link', { name: 'Stock History' });
  }
}

export default ProductShowPage;
