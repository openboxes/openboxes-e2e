import { APIRequestContext } from '@playwright/test';

import ProductService from '@/api/ProductService';
import AppConfig from '@/config/AppConfig';
import ProductConfig from '@/config/ProductConfig';

class ProductData {
  private productService: ProductService;

  private productConfig: ProductConfig;

  constructor(
    productType: keyof AppConfig['products'],
    request: APIRequestContext
  ) {
    this.productService = new ProductService(request);

    this.productConfig = AppConfig.instance.products[productType];
  }

  async getProduct() {
    const id = this.productConfig.readId();

    const { data } = await this.productService.getDemand(id);
    return data?.product;
  }

  async getProductDemand() {
    const id = this.productConfig.readId();
    const { data } = await this.productService.getDemand(id);
    return data?.demand;
  }
}

export default ProductData;
