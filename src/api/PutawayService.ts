import { APIRequestContext } from '@playwright/test';

import BaseServiceModel from '@/api/BaseServiceModel';
import { PUTAWAY_API } from '@/constants/apiUrls';
import { ApiResponse, PutawayCandidate } from '@/types';
import { parseRequestToJSON } from '@/utils/ServiceUtils';

class PutawayService extends BaseServiceModel {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async getPutawayCandidates(
    locationId: string
  ): Promise<ApiResponse<PutawayCandidate[]>> {
    try {
      const apiResponse = await this.request.get(PUTAWAY_API, {
        params: { 'location.id': locationId },
      });
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error(
        `Problem fetching putaway candidates for location: ${locationId}`
      );
    }
  }
}

export default PutawayService;
