import { Page } from '@playwright/test';

import { INVENTORY_ITEM_URL } from '@/constants/applicationUrls';
import BasePageModel from '@/pages/BasePageModel';
import ProductStatusSection from '@/pages/product/productShow/sections/ProductStatusSection';
import RecordStockSection from '@/pages/product/productShow/sections/RecordStockSection';

import InStockTabSection from './tabs/InStockTabSection';
import StockHistoryTabSection from './tabs/StockHistoryTabSection';

class ProductShowPage extends BasePageModel {
  recordStock: RecordStockSection;
  inStockTabSection: InStockTabSection;
  stockHistoryTabSection: StockHistoryTabSection;
  productStatus: ProductStatusSection;

  constructor(page: Page) {
    super(page);
    this.recordStock = new RecordStockSection(page);
    this.inStockTabSection = new InStockTabSection(page);
    this.stockHistoryTabSection = new StockHistoryTabSection(page);
    this.productStatus = new ProductStatusSection(page);
  }

  async goToPage(id: string) {
    await this.page.goto(INVENTORY_ITEM_URL.showStockCard(id));
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

  get editProductButton() {
    return this.page.getByRole('link', { name: 'Edit Product' });
  }
}

export default ProductShowPage;
