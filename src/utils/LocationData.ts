import { APIRequestContext } from '@playwright/test';

import AuthService from '@/api/AuthService';
import LocationService from '@/api/LocationService';
import AppConfig from '@/utils/AppConfig';
import LocationConfig from '@/utils/LocationConfig';

class LocationData {
  private locationService: LocationService;
  private authService: AuthService;

  private locationConfig: LocationConfig

  constructor(locationType: keyof AppConfig['locations'], request: APIRequestContext) {
    this.locationService = new LocationService(request);
    this.authService = new AuthService(request);

    this.locationConfig = AppConfig.instance.locations[locationType];
  }

  async getLocation() {
    return await this.locationService.getLocation(this.locationConfig.id);
  }

  async switchLocation() {
    return await this.authService.changeLocation(this.locationConfig.id);
  }

  
}

export default LocationData;
