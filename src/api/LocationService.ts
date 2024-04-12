import BaseServiceModel from '@/api/BaseServiceModel';

class LocationService extends BaseServiceModel {
  async getLocation(id: string) {
    const apiResponse = await this.request.get(`./api/locations/${id}`);
    return await apiResponse.json();
  }
}

export default LocationService;
