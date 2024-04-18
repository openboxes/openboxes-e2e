import { APIRequestContext } from '@playwright/test';

class BaseServiceModel {
  protected request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }
}

export default BaseServiceModel;
