import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import { cleanupPendingPutaways } from '@/utils/putawayUtils';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';

test.describe('Rollback last receipt behavior when putaway created', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let PUTAWAY_ORDER_IDS: string[] = [];

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      receivingService,
    }) => {
      PUTAWAY_ORDER_IDS = [];
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await productService.getProduct(Product.FIVE);

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 10 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });

      const { data: stockMovement } =
        await stockMovementService.getStockMovement(STOCK_MOVEMENT.id);
      const shipmentId = getShipmentId(stockMovement);
      const { data: receipt } = await receivingService.getReceipt(shipmentId);
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;

      await receivingService.createReceivingBin(shipmentId, receipt);

      await receivingService.updateReceivingItems(shipmentId, [
        {
          shipmentItemId: getShipmentItemId(receipt, 0, 0),
          quantityReceiving: 10,
          binLocationName: receivingBin,
        },
      ]);
      await receivingService.completeReceipt(shipmentId);
    }
  );

  test.afterEach(
    async (
      { stockMovementService, transactionService, putawayService },
      testInfo
    ) => {
      const { allPutawaysCompleted } = await cleanupPendingPutaways({
        putawayService,
        putawayOrderIds: PUTAWAY_ORDER_IDS,
        testInfo,
      });

      if (allPutawaysCompleted) {
        await transactionService.deleteRecentTransactions(2);
      }
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });
    }
  );

  test('Rollback last receipt behavior when putaway created', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    receivingPage,
    putawayListPage,
    putawayDetailsPage,
  }) => {
    await test.step('Go to stock movement show page and assert received status', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
    });

    await test.step('Go to create putaway page', async () => {
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(0).checkbox.click();
      PUTAWAY_ORDER_IDS.push(await createPutawayPage.startPutaway());
      await createPutawayPage.startStep.isLoaded();
    });

    const putawayOrderIdentifier =
      await createPutawayPage.startStep.orderNumberValue.textContent();

    const putawayOrderIdentifierContent = `${putawayOrderIdentifier}`
      .toString()
      .trim();

    await test.step('Select bin to putaway', async () => {
      const internalLocation = await internalLocationService.getLocation();
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
    });

    await test.step('Save progress on pending putaway', async () => {
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to stock movement show page and rollback last receipt when pending putaway created', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await stockMovementShowPage.rollbackLastReceiptButton.click();
      await expect(
        stockMovementShowPage.rollbackReceiptInformationMessage
      ).toBeVisible();
      await expect(
        stockMovementShowPage.rollbackReceiptInformationMessage
      ).toContainText(
        'Successfully rolled back last receipt in stock movement '
      );
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Receive sm', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });

    await test.step('Go to putaway list page', async () => {
      await navbar.inbound.click();
      await navbar.listPutaways.click();
      await putawayListPage.isLoaded();
    });

    await test.step('Open putaway details page', async () => {
      const row = putawayListPage.table.rowByOrderNumber(
        putawayOrderIdentifierContent
      );
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Edit pending putaway', async () => {
      await putawayDetailsPage.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.nextButton.click();
    });

    await test.step('Go to next page and complete putaway', async () => {
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Go to stock movement show page and rollback last receipt when completed putaway created', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await stockMovementShowPage.rollbackLastReceiptButton.click();
      await expect(
        stockMovementShowPage.rollbackReceiptInformationMessage
      ).toBeVisible();
      await expect(
        stockMovementShowPage.rollbackReceiptInformationMessage
      ).toContainText('Unable to rollback last receipt in stock movement');
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });
  });
});
