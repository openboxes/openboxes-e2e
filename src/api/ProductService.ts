import BaseServiceModel from '@/api/BaseServiceModel';
import { ApiResponse, ProductDemandResponse } from '@/types';
import { parseRequestToJSON } from '@/utils/ServiceUtils';

class ProductService extends BaseServiceModel {
  async getDemand(id: string): Promise<ApiResponse<ProductDemandResponse>> {
    try {
      const apiResponse = await this.request.get(`./api/products/${id}/demand`);

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching product demand');
    }
  }
}

export default ProductService;
