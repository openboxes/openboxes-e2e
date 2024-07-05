import { Page } from '@playwright/test';

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
    await this.page.goto('./product/create');
  }

  async waitForUrl() {
    await this.page.waitForURL('**/product/create**');
  }
}

export default CreateProductPage;
