import BaseServiceModel from '@/api/BaseServiceModel';
import { ApiResponse, AppContextResponse, User } from '@/types';

class GenericService extends BaseServiceModel {
  async getAppContext(): Promise<ApiResponse<AppContextResponse>> {
    const apiResponse = await this.request.get('./api/getAppContext');
    return await apiResponse.json();
  }

  async getLoggedInUser(): Promise<User> {
    const {
      data: { user },
    } = await this.getAppContext();
    return user;
  }
}

export default GenericService;
