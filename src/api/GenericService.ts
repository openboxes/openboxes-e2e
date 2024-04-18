import { APIRequestContext } from '@playwright/test';

class GenericService {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async getAppContext() {
    const apiResponse = await this.request.get('./api/getAppContext');
    return await apiResponse.json();
  }
}

export default GenericService;
