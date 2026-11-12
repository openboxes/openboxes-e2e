import BaseServiceModel from '@/api/BaseServiceModel';
import {
  CYCLE_COUNT_BY_ID,
  CYCLE_COUNT_REQUESTS_BATCH,
} from '@/constants/apiUrls';

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

  /**
    Deletes pending cycle count requests (candidates marked as "To Count" via
    the batch-create requests endpoint, but not yet started). Used to clean up
    when a test fails before reaching Start Count, since those requests don't
    cascade-delete with anything else.
  */
  async deletePendingRequests(
    facilityId: string,
    requestIds: string[]
  ): Promise<boolean> {
    const params = new URLSearchParams();
    requestIds.forEach((id) => params.append('id', id));
    const apiResponse = await this.request.delete(
      `${CYCLE_COUNT_REQUESTS_BATCH(facilityId)}?${params.toString()}`
    );
    return apiResponse.ok();
  }
}

export default CycleCountService;
