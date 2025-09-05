import { APIRequestContext } from '@playwright/test';

import ProductService from '@/api/ProductService';
import AppConfig from '@/config/AppConfig';
import ProductConfig from '@/config/ProductConfig';

class ProductData {
  private productService: ProductService;

  private productConfig: ProductConfig;

  constructor(
    request: APIRequestContext
  ) {
    this.productService = new ProductService(request);

    this.productConfig = AppConfig.instance.products['1'];
  }

  setProduct(productCode: string) {
    this.productConfig = AppConfig.instance.products[productCode];
  }

  async getProduct() {
    const id = this.productConfig.readId();

    const { data } = await this.productService.get(id);
    return data;
  }

  async getProductDemand() {
    const id = this.productConfig.readId();
    const { data } = await this.productService.getDemand(id);
    return data?.demand;
  }
}

export default ProductData;
