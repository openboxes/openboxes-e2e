import BaseServiceModel from '@/api/BaseServiceModel';
import {
  ApiResponse,
  CreateLocationPayload,
  LocationResponse,
  LocationType,
} from '@/types';

class LocationService extends BaseServiceModel {
  async getLocation(id: string): Promise<ApiResponse<LocationResponse>> {
    const apiResponse = await this.request.get(`./api/locations/${id}`);
    return await apiResponse.json();
  }

  async createLocation(
    payload: CreateLocationPayload,
    params = {}
  ): Promise<ApiResponse<LocationResponse>> {
    const apiResponse = await this.request.post('./api/locations', {
      data: payload,
      params,
    });
    return await apiResponse.json();
  }

  async getLocationTypes(): Promise<ApiResponse<LocationType[]>> {
    const apiResponse = await this.request.get('./api/locations/locationTypes');
    return await apiResponse.json();
  }
}

export default LocationService;
