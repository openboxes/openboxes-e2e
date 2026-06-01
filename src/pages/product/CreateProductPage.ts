import { Page } from '@playwright/test';

import { PRODUCT_URL } from '@/constants/applicationUrls';
import BasePageModel from '@/pages/BasePageModel';
import ProductDetailsSection from '@/pages/product/sections/ProductDetailsSection';

class CreateProductPage extends BasePageModel {
  productDetails: ProductDetailsSection;

  constructor(page: Page) {
    super(page);
    this.productDetails = new ProductDetailsSection(page);
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  async goToPage() {
    await this.page.goto(PRODUCT_URL.create());
  }

  async waitForUrl() {
    await this.page.waitForURL(PRODUCT_URL.createPattern);
  }
}

export default CreateProductPage;
