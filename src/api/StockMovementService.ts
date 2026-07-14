import { APIRequestContext } from '@playwright/test';

import BaseServiceModel from '@/api/BaseServiceModel';
import {
  STOCK_MOVEMENT_API,
  STOCK_MOVEMENT_BY_ID,
  STOCK_MOVEMENT_STATUS,
  STOCK_MOVEMENT_UPDATE_ITEMS,
  STOCK_MOVEMENT_UPDATE_SHIPMENT,
} from '@/constants/apiUrls';
import { ShipmentType } from '@/constants/ShipmentType';
import { StockMovementDirection } from '@/constants/StockMovementDirection';
import {
  ApiResponse,
  CreateInboundPayload,
  CreateStockMovementPayload,
  LineItemsPayload,
  SendInboundPayload,
  StockMovementListResponse,
  StockMovementResponse,
  UpdateStockMovementItemsPayload,
  UpdateStockMovementPayload,
  UpdateStockMovementStatusPayload,
} from '@/types';
import { formatDate } from '@/utils/DateUtils';
import { parseRequestToJSON } from '@/utils/ServiceUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

import GenericService from './GenericService';

class StockMovementService extends BaseServiceModel {
  private uniqueIdentifier: UniqueIdentifier;
  private genericService: GenericService;

  constructor(request: APIRequestContext) {
    super(request);
    this.uniqueIdentifier = new UniqueIdentifier();
    this.genericService = new GenericService(request);
  }

  async createStockMovement(
    payload: CreateStockMovementPayload
  ): Promise<ApiResponse<StockMovementResponse>> {
    try {
      const apiResponse = await this.request.post(STOCK_MOVEMENT_API, {
        data: payload,
      });

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem creating stock movement');
    }
  }

  async getStockMovements(params: {
    direction: StockMovementDirection;
    destination?: string;
    origin?: string;
  }): Promise<StockMovementListResponse> {
    try {
      const apiResponse = await this.request.get(STOCK_MOVEMENT_API, {
        params,
      });
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching stock movements');
    }
  }

  async deleteStockMovement(id: string) {
    // request.delete does not throw on HTTP error statuses, and a swallowed
    // failed delete leaves the stock movement behind for the next tests
    const apiResponse = await this.request.delete(STOCK_MOVEMENT_BY_ID(id));
    if (!apiResponse.ok()) {
      throw new Error(
        `Problem deleting stock movement ${id}: ${apiResponse.status()}`
      );
    }
  }

  async rollbackLastShipmentStatus(id: string) {
    // request.delete does not throw on HTTP error statuses, and a swallowed
    // failed rollback makes the follow-up delete fail with a status error
    const apiResponse = await this.request.delete(STOCK_MOVEMENT_STATUS(id));
    if (!apiResponse.ok()) {
      throw new Error(
        `Problem rolling back shipment status of stock movement ${id}: ${apiResponse.status()}`
      );
    }
  }

  /*
    Rolls back shipment events (received, shipped) one by one until the
    shipment reaches the given status, e.g. back to PENDING so the stock
    movement can be deleted regardless of the status it reached in the test.
  */
  async rollbackShipmentToStatus(id: string, status: string) {
    // a shipment accumulates one shipped event plus one receipt event per
    // (partial) receipt, so a sane shipment needs just a few rollbacks
    const maxRollbacks = 10;
    for (let i = 0; i < maxRollbacks; i++) {
      const { data } = await this.getStockMovement(id);
      const shipmentStatus = data?.associations?.shipment?.status;
      if (!shipmentStatus || shipmentStatus === status) {
        return;
      }
      await this.rollbackLastShipmentStatus(id);
    }
    throw new Error(
      `Shipment of stock movement ${id} did not get back to ${status} after ${maxRollbacks} rollbacks`
    );
  }

  async getStockMovement(
    id: string
  ): Promise<ApiResponse<StockMovementResponse>> {
    try {
      const apiResponse = await this.request.get(STOCK_MOVEMENT_BY_ID(id));
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem deleting stock movement');
    }
  }

  async updateItems(
    id: string,
    payload: UpdateStockMovementItemsPayload
  ): Promise<ApiResponse<unknown>> {
    try {
      const apiResponse = await this.request.post(
        STOCK_MOVEMENT_UPDATE_ITEMS(id),
        {
          data: payload,
        }
      );

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem updating item');
    }
  }

  async updateShipment(id: string, payload: UpdateStockMovementPayload) {
    try {
      await this.request.post(STOCK_MOVEMENT_UPDATE_SHIPMENT(id), {
        data: payload,
      });
    } catch (error) {
      throw new Error('Problem updating shipment');
    }
  }

  async createInbound(payload: CreateInboundPayload) {
    const { data: context } = await this.genericService.getAppContext();

    const { data } = await this.createStockMovement({
      description:
        payload.description || this.uniqueIdentifier.generateUniqueString('SM'),
      destination: { id: payload.destinationId || context?.location?.id },
      origin: { id: payload.originId },
      requestedBy: { id: payload.requestorId || context?.user?.id },
      dateRequested: payload.dateRequested
        ? formatDate(payload.dateRequested)
        : formatDate(new Date()),
    });

    return data;
  }

  async updateStatusStockMovement(
    id: string,
    payload: UpdateStockMovementStatusPayload
  ) {
    try {
      await this.request.post(STOCK_MOVEMENT_STATUS(id), {
        data: payload,
      });
    } catch (error) {
      throw new Error('Problem updating status');
    }
  }

  async addItemsToInboundStockMovement(
    id: string,
    lineItems: LineItemsPayload
  ) {
    await this.updateItems(id, {
      id,
      lineItems: lineItems.map((it) => ({
        quantityRequested: it.quantity.toString(),
        sortOrder: 100,
        product: { id: it.productId },
        lotNumber: it?.lotNumber,
        expirationDate: it?.expirationDate
          ? formatDate(it?.expirationDate)
          : undefined,
        palletName: it?.palletName,
        boxName: it?.boxName,
        recipient: it.recipientId ? { id: it.recipientId } : undefined,
      })),
    });
    await this.updateStatusStockMovement(id, { status: 'CHECKING' });
  }

  async sendInboundStockMovement(id: string, payload: SendInboundPayload) {
    let shipmentType;
    switch (payload.shipmentType) {
      case ShipmentType.AIR:
        shipmentType = '1';
        break;
      case ShipmentType.SEA:
        shipmentType = '2';
        break;
      case ShipmentType.LAND:
        shipmentType = '3';
        break;

      case ShipmentType.SUITCASE:
        shipmentType = '4';
        break;
      default:
        shipmentType = undefined;
    }

    const DATE_FORMAT = 'MM/DD/YYYY HH:mm Z';

    const res = await this.updateShipment(id, {
      dateShipped: payload.dateShipped
        ? formatDate(payload.dateShipped, DATE_FORMAT)
        : formatDate(new Date(), DATE_FORMAT),
      expectedDeliveryDate: payload.expectedDeliveryDate
        ? formatDate(payload.expectedDeliveryDate, DATE_FORMAT)
        : formatDate(new Date(), DATE_FORMAT),
      shipmentType,
    });
    await this.updateStatusStockMovement(id, { status: 'DISPATCHED' });
    return res;
  }
}

export default StockMovementService;
