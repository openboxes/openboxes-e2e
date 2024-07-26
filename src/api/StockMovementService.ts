import BaseServiceModel from '@/api/BaseServiceModel';
import {
  ApiResponse,
  CreateStockMovementPayload,
  StockMovementResponse,
  UpdateStockMovementItemsPayload,
  UpdateStockMovementPayload,
  UpdateStockMovementStatusPayload,
} from '@/types';

class StockMovementService extends BaseServiceModel {
  async createStockMovement(
    payload: CreateStockMovementPayload
  ): Promise<ApiResponse<StockMovementResponse>> {
    const apiResponse = await this.request.post('./api/stockMovements', {
      data: payload,
    });
    return await apiResponse.json();
  }

  async updateItems(
    id: string,
    payload: UpdateStockMovementItemsPayload
  ): Promise<ApiResponse<unknown>> {
    const apiResponse = await this.request.post(
      `./api/stockMovements/${id}/updateItems`,
      {
        data: payload,
      }
    );
    return await apiResponse.json();
  }

  async updateShipment(
    id: string,
    payload: UpdateStockMovementPayload
  ) {
    await this.request.post(
      `./api/stockMovements/${id}/updateShipment`,
      {
        data: payload,
      }
    );
  }

  async updateStatusStockMovement(
    id: string,
    payload: UpdateStockMovementStatusPayload
  ) {
    await this.request.post(`./api/stockMovements/${id}/status`, {
      data: payload,
    });
  }

  async addItemsToInboundStockMovement(
    id: string,
    payload: UpdateStockMovementItemsPayload
  ) {
    await this.updateItems(id, payload);
    await this.updateStatusStockMovement(id, { status: 'CHECKING' });
  }

  async sendInboundStockMovement(
    id: string,
    payload: UpdateStockMovementPayload
  ) {
    console.log(payload)
    const res = await this.updateShipment(id, payload);
    await this.updateStatusStockMovement(id, { status: 'DISPATCHED' });
    return res;
  }
}

export default StockMovementService;
