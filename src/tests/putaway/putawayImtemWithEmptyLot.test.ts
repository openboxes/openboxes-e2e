import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';

test.describe('Putaway item with empty lot', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      productService.setProduct('5');
      const product2 = await productService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product2.id, quantity: 10 }]
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
    async ({
      stockMovementShowPage,
      stockMovementService,
      navbar,
      transactionListPage,
      oldViewShipmentPage,
    }) => {
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      for (let n = 1; n < 7; n++) {
        await transactionListPage.deleteTransaction(1);
      }
      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT,
      });
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
    }
  );

  test('Putaway item with empty lot', async ({
    mainLocationService,
    navbar,
    createPutawayPage,
    internalLocationService,
    productShowPage,
    putawayDetailsPage,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const currentLocation = await mainLocationService.getLocation();
    const internalLocation = await internalLocationService.getLocation();
    productService.setProduct('6');
    const product = await productService.getProduct();
    productService.setProduct('5');
    const product2 = await productService.getProduct();

    await test.step('Go to stockcard', async () => {
      await productShowPage.goToPage(product.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
    });

    await test.step('Edit item lot to spaces', async () => {
      await productShowPage.inStockTabSection.row(1).actionsButton.click();
      await productShowPage.inStockTabSection.editItem.click();
      await productShowPage.inStockTabSection.editItemDialog.isLoaded();
      await productShowPage.inStockTabSection.editItemDialog.lotField.fill(
        '   '
      );
      await productShowPage.inStockTabSection.editItemDialog.saveButton.click();
    });

    await test.step('Open transfer stock dialog the inventory', async () => {
      await productShowPage.inStockTabSection.row(1).actionsButton.click();
      await productShowPage.inStockTabSection.stockTransferButton.click();
      await productShowPage.inStockTabSection.stockTransferDialog.isLoaded();
    });

    await test.step('Perform Stock Transfer of inventory to receiving bin', async () => {
      await productShowPage.inStockTabSection.stockTransferDialog.locationSelect.click();
      await productShowPage.inStockTabSection.stockTransferDialog.selectLocation(
        currentLocation.name
      );
      await productShowPage.inStockTabSection.stockTransferDialog.binLocationSelect.click();
      await productShowPage.inStockTabSection.stockTransferDialog.selectLocation(
        receivingBin
      );
      await productShowPage.inStockTabSection.stockTransferDialog.transferStockButton.click();
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(receivingBin);
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
    });

    await test.step('Go to create putaway page and assert data', async () => {
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
      await expect(createPutawayPage.table.row(0).receivingBin).toContainText(
        receivingBin
      );
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getProductName(product2.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getProductName(product.name)
      ).toBeVisible();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.table.row(2).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway', async () => {
      await createPutawayPage.startStep.table.row(1).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.table.row(2).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.nextButton.click();
    });

    await test.step('Go to next page and complete putaway', async () => {
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    const ifConfirmDialogIsVisible =
      await createPutawayPage.completeStep.confirmPutawayDialog.isVisible();

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (ifConfirmDialogIsVisible) {
      await test.step('Accept dialog if visible', async () => {
        await createPutawayPage.completeStep.yesButtonOnConfirmPutawayDialog
          .last()
          .click();
      });
    }

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert putaway bin on stock card', async () => {
      await putawayDetailsPage.summaryTab.click();
      await productShowPage.goToPage(product.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(internalLocation.name);
    });
  });
});
