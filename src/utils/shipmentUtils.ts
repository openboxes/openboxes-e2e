import { ReceiptResponse, StockMovementResponse } from '@/types';

export const getShipmentId = (stockMovement: StockMovementResponse) => {
  return stockMovement.associations.shipment.id;
};

export const getShipmentItemId = (
  receipt: ReceiptResponse,
  containerIndex: number,
  shipmentItemIndex: number
) => {
  return receipt.containers[containerIndex].shipmentItems[shipmentItemIndex]
    .shipmentItemId;
};
