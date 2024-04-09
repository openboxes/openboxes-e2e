import { APIRequestContext } from '@playwright/test';

class GenericService {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async getAppContext() {
    const apiRepsonse = await this.request.get('./api/getAppContext');
    return await apiRepsonse.json();
  }
}

export default GenericService;
