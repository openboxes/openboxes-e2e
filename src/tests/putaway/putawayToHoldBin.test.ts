import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Putaway item into hold bin', () => {
  test.describe.configure({ timeout: 60000 });
  //timeout has been added for this test to make sure that the content on bin location tab will load as it can include a lot of data
  let STOCK_MOVEMENT: StockMovementResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const holdBinLocationName = uniqueIdentifier.generateUniqueString('holdbin');

  test.beforeEach(
    async ({
      supplierLocationService,
      mainLocationService,
      stockMovementService,
      productService,
      receivingService,
      page,
      locationListPage,
      createLocationPage,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      productService.setProduct('5');
      const product = await productService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

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

      await test.step('Create bin location with hold stock activity for location', async () => {
        await BinLocationUtils.createHoldBin({
          mainLocationService,
          locationListPage,
          createLocationPage,
          page,
          holdBinLocationName,
        });
      });
    }
  );

  test.afterEach(
    async ({
      navbar,
      transactionListPage,
      stockMovementShowPage,
      stockMovementService,
      page,
      locationListPage,
      mainLocationService,
      createLocationPage,
      oldViewShipmentPage,
    }) => {
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();

      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT,
      });

      await test.step('Deactivate created bin location', async () => {
        await BinLocationUtils.deactivateCreatedBin({
          mainLocationService,
          locationListPage,
          createLocationPage,
          page,
          binLocationName: holdBinLocationName,
        });
      });

      await BinLocationUtils.deactivateReceivingBin({
        mainLocationService,
        locationListPage,
        createLocationPage,
        page,
        receivingBin,
      });
    }
  );

  test('Putaway to hold bin', async ({
    stockMovementShowPage,
    createPutawayPage,
    putawayDetailsPage,
    navbar,
    productShowPage,
    productService,
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
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway', async () => {
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(holdBinLocationName)
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
      productService.setProduct('5');
      const product = await productService.getProduct();
      await productShowPage.goToPage(product.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(holdBinLocationName);
      await expect(
        productShowPage.inStockTabSection.row(1).row
      ).toHaveAttribute('title', 'This bin has been restricted');
      await expect(
        productShowPage.inStockTabSection.row(1).inventoryInformation
      ).toHaveText('Hold');
    });
  });
});
