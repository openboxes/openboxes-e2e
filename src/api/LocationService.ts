import BaseServiceModel from '@/api/BaseServiceModel';
import {
  INTERNAL_LOCATIONS_SEARCH,
  LOCATION_API,
  LOCATION_BY_ID,
  LOCATION_TYPES,
} from '@/constants/apiUrls';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
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
    parentLocationId: string,
    includeInactive = true
  ): Promise<ApiResponse<LocationResponse[]>> {
    try {
      const apiResponse = await this.request.get(INTERNAL_LOCATIONS_SEARCH, {
        params: {
          searchTerm,
          'parentLocation.id': parentLocationId,
          includeInactive,
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

  async updateLocation(id: string, payload: Partial<CreateLocationPayload>) {
    try {
      const apiResponse = await this.request.post(LOCATION_BY_ID(id), {
        data: payload,
      });
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error(`Problem updating location with id: ${id}`);
    }
  }

  async deactivateLocation(id: string) {
    return this.updateLocation(id, { active: false });
  }

  async getLocationTypes(): Promise<ApiResponse<LocationType[]>> {
    try {
      const apiResponse = await this.request.get(LOCATION_TYPES);

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching location types');
    }
  }

  /**
    Returns the id of the bin location with the given name under the given
    parent location, creating it first if it doesn't exist yet.
  */
  async getOrCreateBinLocation(
    name: string,
    parentLocationId: string
  ): Promise<string> {
    const { data: existingLocations } = await this.searchInternalLocations(
      name,
      parentLocationId
    );
    const existingLocation = existingLocations.find(
      (location) => location.name === name
    );
    if (existingLocation) {
      return existingLocation.id;
    }

    const { data: locationTypes } = await this.getLocationTypes();
    const binLocationType = locationTypes.find(
      (locationType) =>
        locationType.locationTypeCode === LocationTypeCode.BIN_LOCATION
    );

    const { data: createdLocation } = await this.createLocation({
      active: true,
      name,
      locationType: binLocationType,
      parentLocation: { id: parentLocationId },
    });
    return createdLocation.id;
  }
}

export default LocationService;
