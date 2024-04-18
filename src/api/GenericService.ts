import BaseServiceModel from '@/api/BaseServiceModel';

class GenericService extends BaseServiceModel {
  async getAppContext() {
    const apiResponse = await this.request.get('./api/getAppContext');
    return await apiResponse.json();
  }
}

export default GenericService;
