import BaseServiceModel from '@/api/BaseServiceModel';
import { ApiResponse, LocationResponse } from '@/types';

class LocationService extends BaseServiceModel {
  async getLocation(id: string): Promise<ApiResponse<LocationResponse>> {
    const apiResponse = await this.request.get(`./api/locations/${id}`);
    return await apiResponse.json();
  }
}

export default LocationService;
