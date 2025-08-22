import BaseServiceModel from '@/api/BaseServiceModel';
import { ApiResponse, ProductDemandResponse, ProductResponse } from '@/types';
import { jsonToCsv, parseRequestToJSON } from '@/utils/ServiceUtils';

class ProductService extends BaseServiceModel {
  async getDemand(id: string): Promise<ApiResponse<ProductDemandResponse>> {
    try {
      const apiResponse = await this.request.get(`./api/products/${id}/demand`);

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching product demand');
    }
  }

  async get(id: string): Promise<ApiResponse<ProductResponse>> {
    try {
      const apiResponse = await this.request.get(`./api/products/${id}`);

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching product data');
    }
  }

  async importProducts(data: Record<string, string>[]): Promise<ApiResponse<ProductResponse[]>> {
    try {
      const csvContent = jsonToCsv(data);

      const apiResponse = await this.request.post(
        './api/products/import',
        {
        data: csvContent,
        headers: { 'Content-Type': 'text/csv' }
        }
      );

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem importing products');
    }
  }
}

export default ProductService;
