import BaseServiceModel from '@/api/BaseServiceModel';

class AuthService extends BaseServiceModel {
  async login(data: { username: string; password: string; location?: string }) {
    const apiResponse = await this.request.get('./api/login', { data });
    return await apiResponse.body();
  }
  
  async changeLocation(locationId: string) {
    const apiResponse = await this.request.put(`./api/chooseLocation/${locationId}`);
    return await apiResponse.body();
  }
}

export default AuthService;
