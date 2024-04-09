import { APIRequestContext } from '@playwright/test';

import AppConfig from '@/utils/AppConfig';

class GenericService {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async getAppContext() {
    const apiRepsonse = await this.request.get(
      `${AppConfig.instance.apiURL}/getAppContext`
    );
    return await apiRepsonse.json();
  }
}

export default GenericService;
