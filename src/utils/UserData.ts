import { APIRequestContext } from '@playwright/test';

import GenericService from '@/api/GenericService';
import AppConfig from '@/config/AppConfig';
import TestUserConfig from '@/config/TestUserConfig';

class ProductData {
  private genericService: GenericService;

  private userConfig: TestUserConfig;

  constructor(
    userType: keyof AppConfig['users'],
    request: APIRequestContext
  ) {
    this.genericService = new GenericService(request);

    this.userConfig = AppConfig.instance.users[userType];
  }

  async getUser() {
    const id = this.userConfig.readId();
    const { data } = await this.genericService.getUser(id);
    return data;
  }

}

export default ProductData;
