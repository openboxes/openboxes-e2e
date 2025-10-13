//import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Putaway received inbound shipment', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      fifthProductService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await fifthProductService.getProduct();

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
      // const receivingBin =
      //   AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;

      await receivingService.updateReceivingItems(shipmentId, [
        {
          shipmentItemId: getShipmentItemId(receipt, 0, 0),
          quantityReceiving: 10,
          binLocationName: 'R-804CSX',
        },
      ]);
      await receivingService.completeReceipt(shipmentId);
    }
  );

  test.afterEach(
    async ({
      stockMovementShowPage,
      stockMovementService,
      navbar,
      transactionListPage,
      oldViewShipmentPage,
    }) => {
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();

      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Create putaway inbound stock movement', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    productShowPage,
    putawayDetailsPage,
    fifthProductService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
    });

    await test.step('Go to create putaway page', async () => {
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(0).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway', async () => {
      const internalLocation = await internalLocationService.getLocation();
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
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

    await test.step('Assert putaway bin on stock card', async () => {
      await putawayDetailsPage.summaryTab.click();
      const product = await fifthProductService.getProduct();
      await putawayDetailsPage.table
        .row(1)
        .getProductName(product.name)
        .click();
      //console.log(row);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      const internalLocation = await internalLocationService.getLocation();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(internalLocation.name);
    });
  });
});
