import BaseServiceModel from '@/api/BaseServiceModel';
import {
  INTERNAL_LOCATIONS_SEARCH,
  LOCATION_API,
  LOCATION_BY_ID,
  LOCATION_TYPES,
} from '@/constants/apiUrls';
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
      const apiResponse = await this.request.get(LOCATION_BY_ID(id));
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
      const apiResponse = await this.request.post(LOCATION_API, {
        data: payload,
        params,
      });
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem creating a location');
    }
  }

  async searchInternalLocations(
    searchTerm: string,
    parentLocationId: string
  ): Promise<ApiResponse<LocationResponse[]>> {
    try {
      const apiResponse = await this.request.get(INTERNAL_LOCATIONS_SEARCH, {
        params: {
          searchTerm,
          'parentLocation.id': parentLocationId,
          includeInactive: true,
        },
      });
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error(
        `Problem searching internal locations by term: ${searchTerm}`
      );
    }
  }

  async deleteLocation(id: string): Promise<boolean> {
    const apiResponse = await this.request.delete(LOCATION_BY_ID(id));
    return apiResponse.ok();
  }

  async updateLocation(id: string, payload: { active: boolean }) {
    try {
      const apiResponse = await this.request.post(LOCATION_BY_ID(id), {
        data: payload,
      });
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error(`Problem updating location with id: ${id}`);
    }
  }

  async getLocationTypes(): Promise<ApiResponse<LocationType[]>> {
    try {
      const apiResponse = await this.request.get(LOCATION_TYPES);

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching location types');
    }
  }
}

export default LocationService;
