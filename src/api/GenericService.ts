import BaseServiceModel from '@/api/BaseServiceModel';
import { APP_CONTEXT, GENERIC_USER_BY_ID } from '@/consts/apiUrls';
import { ApiResponse, AppContextResponse, User } from '@/types';
import { parseRequestToJSON } from '@/utils/ServiceUtils';

class GenericService extends BaseServiceModel {
  async getAppContext(): Promise<ApiResponse<AppContextResponse>> {
    try {
      const apiResponse = await this.request.get(APP_CONTEXT);
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching app context');
    }
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const apiResponse = await this.request.get(GENERIC_USER_BY_ID(id));
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error(`Problem fetching a user with id: ${id}`);
    }
  }

  async getLoggedInUser(): Promise<User> {
    try {
      const {
        data: { user },
      } = await this.getAppContext();
      return user;
    } catch (error) {
      throw new Error('Problem fetching logged in user');
    }
  }
}

export default GenericService;
