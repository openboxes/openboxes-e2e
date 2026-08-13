import BaseServiceModel from '@/api/BaseServiceModel';
import { CYCLE_COUNT_BY_ID } from '@/constants/apiUrls';

class CycleCountService extends BaseServiceModel {
  /**
    Deletes a cycle count and cascades to its cycle count request, counted
    transactions and their sources, reverting the quantityOnHand adjustments
    they caused.
  */
  async deleteCycleCount(
    facilityId: string,
    cycleCountId: string
  ): Promise<boolean> {
    const apiResponse = await this.request.delete(
      CYCLE_COUNT_BY_ID(facilityId, cycleCountId)
    );
    return apiResponse.ok();
  }
}

export default CycleCountService;
