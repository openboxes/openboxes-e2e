import { APIRequestContext } from '@playwright/test';

import ProductService from '@/api/ProductService';
import AppConfig from '@/config/AppConfig';
import { ProductCode } from '@/generated/ProductCodes.generated';

class ProductData {
  private productService: ProductService;

  constructor(request: APIRequestContext) {
    this.productService = new ProductService(request);
  }

  async getProduct(code: ProductCode) {
    const id = AppConfig.instance.products[code].readId();
    const { data } = await this.productService.get(id);
    return data;
  }

  async getProductDemand(code: ProductCode) {
    const id = AppConfig.instance.products[code].readId();
    const { data } = await this.productService.getDemand(id);
    return data?.demand;
  }
}

export default ProductData;
