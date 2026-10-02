import { APIRequestContext } from '@playwright/test';

import BaseServiceModel from '@/api/BaseServiceModel';
import {
  PUTAWAY_API,
  PUTAWAY_BY_ID,
  STOCK_TRANSFER_BY_ID,
} from '@/constants/apiUrls';
import { MIGRATION_URL } from '@/constants/applicationUrls';
import { ApiResponse, PutawayCandidate, PutawayResponse } from '@/types';
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

  /**
    Recalculates product_availability for a location from the transaction
    ledger. Putaway candidates are read from product_availability rather than
    the ledger directly, so a candidate can go stale (stuck at a quantity the
    ledger no longer backs) after a shipment gets rolled back and deleted;
    this is the app's own admin action for reconciling it.
  */
  async refreshProductAvailability(locationId: string) {
    const apiResponse = await this.request.post(
      MIGRATION_URL.refreshProductAvailability(locationId)
    );
    if (!apiResponse.ok()) {
      throw new Error(
        `Problem refreshing product availability for location: ${locationId}`
      );
    }
  }

  /**
    Fetches a putaway order by id. Returns null when the order does not exist.
  */
  async getPutaway(
    orderId: string
  ): Promise<ApiResponse<PutawayResponse> | null> {
    const apiResponse = await this.request.get(PUTAWAY_BY_ID(orderId));
    if (!apiResponse.ok()) {
      return null;
    }
    return await parseRequestToJSON(apiResponse);
  }

  /**
    Putaway orders are transfer orders under the hood, so they are deleted
    through the stock transfer API. The server only allows deleting orders
    that have not been completed yet.
  */
  async deletePutawayOrder(orderId: string) {
    const apiResponse = await this.request.delete(
      STOCK_TRANSFER_BY_ID(orderId)
    );
    if (!apiResponse.ok()) {
      throw new Error(
        `Problem deleting putaway order ${orderId}: ${apiResponse.status()}`
      );
    }
  }
}

export default PutawayService;
