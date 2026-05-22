import { Page } from '@playwright/test';

import { PRODUCT_URL } from '@/consts/applicationUrls';
import BasePageModel from '@/pages/BasePageModel';
import InventoryLevelsTabSection from '@/pages/product/productEdit/tabs/InventoryLevelsTabSection';

class ProductEditPage extends BasePageModel {
  inventoryLevelsTabSection: InventoryLevelsTabSection;

  constructor(page: Page) {
    super(page);
    this.inventoryLevelsTabSection = new InventoryLevelsTabSection(page);
  }

  async goToPage(id: string) {
    await this.page.goto(PRODUCT_URL.edit(id));
  }

  get detailskTab() {
    return this.page.getByRole('link', { name: 'Details' });
  }

  get inventoryLevelsTab() {
    return this.page.getByRole('link', { name: 'Inventory Levels' });
  }
}

export default ProductEditPage;
