import ReceivingService from '@/api/ReceivingService';
import StockMovementService from '@/api/StockMovementService';
import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
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

/*
  Sends an inbound stock movement and receives the given quantities (one per
  line, in order) into a single receiving bin, then completes the receipt.
*/
export async function receiveInbound(
  {
    stockMovementService,
    receivingService,
  }: {
    stockMovementService: StockMovementService;
    receivingService: ReceivingService;
  },
  stockMovement: StockMovementResponse,
  quantities: number[],
  shipmentType: ShipmentType = ShipmentType.AIR
) {
  await stockMovementService.sendInboundStockMovement(stockMovement.id, {
    shipmentType,
  });

  const { data: refreshed } = await stockMovementService.getStockMovement(
    stockMovement.id
  );
  const shipmentId = getShipmentId(refreshed);
  const { data: receipt } = await receivingService.getReceipt(shipmentId);
  const receivingBin =
    AppConfig.instance.receivingBinPrefix + stockMovement.identifier;

  await receivingService.createReceivingBin(shipmentId, receipt);
  await receivingService.updateReceivingItems(
    shipmentId,
    quantities.map((quantity, index) => ({
      shipmentItemId: getShipmentItemId(receipt, 0, index),
      quantityReceiving: quantity,
      binLocationName: receivingBin,
    }))
  );
  await receivingService.completeReceipt(shipmentId);
}

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
