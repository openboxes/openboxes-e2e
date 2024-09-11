import BaseServiceModel from '@/api/BaseServiceModel';
import {
  ApiResponse,
  CreateLocationPayload,
  LocationResponse,
  LocationType,
} from '@/types';
import { parseRequestToJSON } from '@/utils/ServiceUtils';

class LocationService extends BaseServiceModel {
  async getLocation(id: string): Promise<ApiResponse<LocationResponse>> {
    try {
      const apiResponse = await this.request.get(`./api/locations/${id}`);
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error(`Problem fetching location with id: ${id}`);
    }
  }

  async createLocation(
    payload: CreateLocationPayload,
    params = {}
  ): Promise<ApiResponse<LocationResponse>> {
    try {
      const apiResponse = await this.request.post('./api/locations', {
        data: payload,
        params,
      });
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem creating a location');
    }
  }

  async getLocationTypes(): Promise<ApiResponse<LocationType[]>> {
    try {
      const apiResponse = await this.request.get(
        './api/locations/locationTypes'
      );

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching location types');
    }
  }
}

export default LocationService;
