import BaseServiceModel from '@/api/BaseServiceModel';
import { ApiResponse, ProductDemandResponse } from '@/types';

class ProductService extends BaseServiceModel {
  async getDemand(id: string): Promise<ApiResponse<ProductDemandResponse>> {
    const apiResponse = await this.request.get(`./api/products/${id}/demand`);
    return await apiResponse.json();
  }
}

export default ProductService;
