import { APIRequestContext } from '@playwright/test';
import _ from 'lodash';

import BaseServiceModel from '@/api/BaseServiceModel';
import { PartialReceiptStatus } from '@/constants/PartialReceiptStatus';
import {
  ApiResponse,
  Container,
  ReceiptPayload,
  ReceiptResponse,
  ReceivingItemPayload,
  ShipmentItem,
  UnflattenContainer,
} from '@/types';
import { parseRequestToJSON, unflatten } from '@/utils/ServiceUtils';

class ReceivingService extends BaseServiceModel {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /*
    As an argument takes the shipment id, returns the receipt object.
  */
  async getReceipt(id: string): Promise<ApiResponse<ReceiptResponse>> {
    try {
      const apiResponse = await this.request.get(
        `./api/partialReceiving/${id}`
      );
      return await parseRequestToJSON(apiResponse);
    } catch (error) {
      throw new Error('Problem fetching partial receipt');
    }
  }

  /*
    As an argument takes the shipment id, changes the receipt status
    to completed.
  */
  async completeReceipt(id: string): Promise<void> {
    try {
      await this.changeReceiptStatus(id, PartialReceiptStatus.COMPLETED);
    } catch (error) {
      throw new Error('Problem completing partial receipt');
    }
  }

  /*
    As an argument takes the shipment id, rolls back the receipt (changes
    the receipt status).
  */
  async rollbackReceipt(id: string): Promise<void> {
    try {
      await this.changeReceiptStatus(id, PartialReceiptStatus.ROLLBACK);
    } catch (error) {
      throw new Error('Problem rolling back partial receipt');
    }
  }

  /*
    As arguments take the shipment id and items that need to be updated.
    It updates the receiving now quantity, comment and bin location field.
    Usage:
      await receivingService.updateReceivingItems(
      'shipmentId', [
        {
          shipmentItemId: 'firstShipmentItemId',
          quantityReceiving: quantityReceiving,
          comment: 'comment',
          binLocation: 'binLocationId'
        },
        {
          shipmentItemId: 'secondShipmentItemId',
          quantityReceiving: quantityReceiving,
          comment: 'comment',
          binLocation: 'binLocationId'
        }
    ]);
  */
  async updateReceivingItems(
    id: string,
    items: ReceivingItemPayload[]
  ): Promise<void> {
    try {
      const receipt = await this.getReceipt(id);
      const shipmentItemsToUpdate = this.extractShipmentItemIds(items);
      const containers = this.buildUpdatedContainers(
        receipt.data.containers,
        items,
        shipmentItemsToUpdate
      );
      const payload: ReceiptPayload = {
        ...receipt.data,
        containers: containers,
        recipient: receipt?.data?.recipient?.id,
      };
      await this.request.post(`./api/partialReceiving/${id}`, {
        data: payload,
      });
    } catch (error) {
      throw new Error('Problem updating items');
    }
  }

  /*
    As arguments take the shipment id, id of receipt item that needs to be split,
    new lines are an array filled with new items, including the original one, that is split.
    The sum of all quantities in that batch should be equal to the quantity of the original item.
    This function does exactly the same that can be done using the split line modal.
    For new line lot number, expiration date and quantity shipped can be passed.
    Usage:
      await receivingService.splitReceivingLine(
      'shipmentId',
      'id of receipt item that will be split', [
        {
          shipmentItemId: 'shipment item id',
          receiptItemId: 'receipt item id', <- this line is treated as an original
          quantityShipped: new quantity shipped,
        },
        {
          shipmentItemId: 'shipment item id',
          receiptItemId: null, <- receipt item id should be set to null for all new items (backend requirement)
          quantityShipped: new quantity shipped,
          lotNumber: 'new lot number',
          expirationDate: 'new expiration date',
          newLine: true, <- new line should be set to true for all new items (backend requirement)
        },
        {
          shipmentItemId: 'shipment item id',
          receiptItemId: null,
          quantityShipped: new quantity shipped,
          lotNumber: 'new lot number',
          expirationDate: 'new expiration date',
          newLine: true,
        }
      ]);
  */
  async splitReceivingLine(
    id: string,
    originalReceiptItemId: string,
    newLines: ReceivingItemPayload[]
  ) {
    try {
      const receipt = await this.getReceipt(id);

      const originalShipmentItem = this.findOriginalShipmentItem(
        receipt.data.containers,
        originalReceiptItemId
      );
      if (!originalShipmentItem) {
        throw new Error(
          `Original shipment item with ID ${originalReceiptItemId} not found`
        );
      }

      this.validateQuantity(originalShipmentItem.quantityShipped, newLines);

      const containers = this.buildSplitContainers(
        receipt.data.containers,
        originalReceiptItemId,
        newLines
      );

      const payload = this.buildPayload(receipt.data, containers);

      await this.saveSplitLines(id, payload);
    } catch (error) {
      throw new Error('Problem splitting lines');
    }
  }

  private findOriginalShipmentItem(
    containers: Container[],
    receiptItemId: string
  ): ShipmentItem | undefined {
    return _.flatten(containers.map((c) => c.shipmentItems)).find(
      (item) => item.receiptItemId === receiptItemId
    );
  }

  private validateQuantity(
    originalQuantityShipped: number | undefined,
    newLines: ReceivingItemPayload[]
  ) {
    const sumOfQuantityShipped = _.sumBy(newLines, 'quantityShipped');
    const originalQty = originalQuantityShipped || 0;

    if (originalQty < sumOfQuantityShipped) {
      throw new Error(
        'Sum of quantity shipped is greater than the original quantity shipped'
      );
    }
  }

  private buildSplitContainers(
    containers: Container[],
    originalReceiptItemId: string,
    newLines: ReceivingItemPayload[]
  ): UnflattenContainer[] {
    const splittedItem = newLines.find(
      (line) => line.receiptItemId === originalReceiptItemId
    );
    const linesToSave = newLines.filter((line) => !line.receiptItemId);

    return containers.map((container) => {
      const updatedShipmentItems = _.flatten(
        container.shipmentItems.map((shipmentItem: ShipmentItem) => {
          if (shipmentItem.receiptItemId === originalReceiptItemId) {
            return [{ ...shipmentItem, ...splittedItem }, ...linesToSave];
          }
          return shipmentItem;
        })
      );

      return unflatten({
        ...container,
        shipmentItems: updatedShipmentItems,
      }) as UnflattenContainer;
    });
  }

  private buildPayload(
    receiptData: ReceiptResponse,
    containers: UnflattenContainer[]
  ): ReceiptPayload {
    return {
      ...receiptData,
      containers,
      recipient: receiptData.recipient.id,
    };
  }

  private async saveSplitLines(id: string, payload: ReceiptPayload) {
    await this.request.post(`./api/partialReceiving/${id}`, {
      data: payload,
    });
  }

  private async changeReceiptStatus(
    id: string,
    status: PartialReceiptStatus
  ): Promise<void> {
    await this.request.post(`./api/partialReceiving/${id}`, {
      data: {
        id,
        stepNumber: 2,
        receiptStatus: status,
      },
    });
  }

  private extractShipmentItemIds(items: ReceivingItemPayload[]): string[] {
    return items.map((item) => item.shipmentItemId);
  }

  private buildUpdatedContainers(
    containers: Container[],
    items: ReceivingItemPayload[],
    shipmentItemsToUpdate: string[]
  ): UnflattenContainer[] {
    return containers.map((container) => {
      return unflatten({
        ...container,
        shipmentItems: container.shipmentItems.map(
          (shipmentItem: ShipmentItem) => {
            if (shipmentItemsToUpdate.includes(shipmentItem.shipmentItemId)) {
              const updatedItem = this.findItemToUpdate(
                items,
                shipmentItem.shipmentItemId
              );
              return this.mergeShipmentItem(shipmentItem, updatedItem);
            }

            return shipmentItem;
          }
        ),
      }) as UnflattenContainer;
    });
  }

  private findItemToUpdate(
    items: ReceivingItemPayload[],
    shipmentItemId: string
  ): ReceivingItemPayload | undefined {
    return items.find((item) => item.shipmentItemId === shipmentItemId);
  }

  private mergeShipmentItem(
    original: ShipmentItem,
    update?: ReceivingItemPayload
  ): ShipmentItem {
    return {
      ...original,
      'binLocation.name': update?.binLocationName ?? original.binLocationName,
      quantityReceiving:
        update?.quantityReceiving ?? original.quantityReceiving,
      comment: update?.comment ?? original.comment,
    };
  }
}

export default ReceivingService;
