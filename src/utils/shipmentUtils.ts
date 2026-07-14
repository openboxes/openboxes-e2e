import { expect } from '@playwright/test';

import PutawayService from '@/api/PutawayService';
import ReceivingService from '@/api/ReceivingService';
import StockMovementService from '@/api/StockMovementService';
import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
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

/**
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

/**
  Deletes a stock movement through the API regardless of the shipment status,
  rolling back the received and shipped events first when needed.
*/
export async function deleteShipment({
  stockMovementService,
  STOCK_MOVEMENT,
}: {
  STOCK_MOVEMENT: StockMovementResponse;
  stockMovementService: StockMovementService;
}) {
  await stockMovementService.rollbackShipmentToStatus(
    STOCK_MOVEMENT.id,
    'PENDING'
  );
  await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

  // The server clears receiving-bin stock asynchronously after the stock
  // movement is deleted, so a putaway candidate from this shipment can stay
  // visible for a while; wait until it is gone so the next test (or the
  // clean-state validation) does not see a phantom row.
  const putawayService = new PutawayService(
    stockMovementService.getRequestContext()
  );
  const destinationId =
    STOCK_MOVEMENT.destination?.id ??
    AppConfig.instance.locations.main.readId();
  await expect
    .poll(
      async () => {
        const { data: candidates } =
          await putawayService.getPutawayCandidates(destinationId);
        // candidate references contain the receiving bin name
        // (e.g. "R-<identifier>") rather than the bare stock movement
        // identifier, and decay to null mid-deletion, so match loosely
        return candidates.filter((candidate) => {
          const references = [
            candidate['stockMovement.id'],
            candidate['stockMovement.name'],
            candidate['currentLocation.name'],
          ];
          return (
            references.every((reference) => !reference) ||
            references.some((reference) =>
              reference?.includes(STOCK_MOVEMENT.identifier)
            )
          );
        }).length;
      },
      {
        message: `Putaway candidates from ${STOCK_MOVEMENT.identifier} are still present after deleting the stock movement`,
        timeout: 30_000,
      }
    )
    .toBe(0);
}
