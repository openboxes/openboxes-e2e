import { APIRequestContext } from '@playwright/test';

import BaseServiceModel from '@/api/BaseServiceModel';
import { ShipmentType } from '@/constants/ShipmentType';
import {
  ApiResponse,
  CreateInboundPayload,
  CreateStockMovementPayload,
  LineItemsPayload,
  SendInboundPayload,
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
      const apiResponse = await this.request.post('./api/stockMovements', {
        data: payload,
      });

      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem creating stock movement');
    }
  }

  async deleteStockMovement(id: string) {
    try {
      await this.request.delete(`./api/stockMovements/${id}`);
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
        `./api/stockMovements/${id}/updateItems`,
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
      await this.request.post(`./api/stockMovements/${id}/updateShipment`, {
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
      await this.request.post(`./api/stockMovements/${id}/status`, {
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
