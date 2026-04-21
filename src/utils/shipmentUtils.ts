import StockMovementService from '@/api/StockMovementService';
import OldViewShipmentPage from '@/pages/stockMovementShow/OldViewShipmentPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
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

export async function deleteReceivedShipment({
  stockMovementShowPage,
  oldViewShipmentPage,
  stockMovementService,
  STOCK_MOVEMENT,
}: {
  STOCK_MOVEMENT: StockMovementResponse;
  stockMovementService: StockMovementService;
  stockMovementShowPage: StockMovementShowPage;
  oldViewShipmentPage: OldViewShipmentPage;
}) {
  await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
  await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
  await oldViewShipmentPage.undoStatusChangeButton.click();
  await stockMovementShowPage.isLoaded();
  await stockMovementShowPage.rollbackButton.click();
  await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
}
