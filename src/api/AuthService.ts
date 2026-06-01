import BaseServiceModel from '@/api/BaseServiceModel';
import { CHOOSE_LOCATION, LOGIN_API } from '@/constants/apiUrls';

class AuthService extends BaseServiceModel {
  async login(data: { username: string; password: string; location?: string }) {
    const apiResponse = await this.request.get(LOGIN_API, { data });
    if (apiResponse.status() !== 200) {
      throw new Error(`Authentication for user "${data.username}" failed`);
    }
  }

  async changeLocation(locationId: string) {
    const apiResponse = await this.request.put(CHOOSE_LOCATION(locationId));
    return await apiResponse.body();
  }
}

export default AuthService;
