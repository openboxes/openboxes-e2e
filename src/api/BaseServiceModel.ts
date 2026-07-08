import { APIRequestContext } from '@playwright/test';

class BaseServiceModel {
  protected request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  getRequestContext() {
    return this.request;
  }
}

export default BaseServiceModel;
