import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Split line in Putaway', () => {
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
      const product = await productService.getProduct();

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

  test('Assert split line in Putaway', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    internalLocation2Service,
    putawayDetailsPage,
    productShowPage,
    productService,
  }) => {
    const internalLocation = await internalLocationService.getLocation();
    const internalLocation2 = await internalLocation2Service.getLocation();
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    await test.step('Go to create putaway page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await RefreshCachesUtils.refreshCaches({
        navbar
      });
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(0).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Split line in putaway', async () => {
      await createPutawayPage.startStep.table.row(0).splitLineButton.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .getPutawayBin(internalLocation2.name);
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.saveButton.click();
    });

    await test.step('Assert split line on start step', async () => {
      await expect(
        createPutawayPage.startStep.table.row(0).splitLineInPutawayBin
      ).toHaveText('Split line');
    });

    await test.step('Go to next page and assert split line on complete step', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).putawayBin
      ).toContainText(internalLocation.name);
      await expect(
        createPutawayPage.completeStep.table.row(3).putawayBin
      ).toContainText(internalLocation.name);
    });

    await test.step('Complete and assert completing putaway', async () => {
      await createPutawayPage.completeStep.completePutawayButton.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert content of items status table', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).itemStatus
      ).toHaveText('COMPLETED');
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).originBin
      ).toHaveText(receivingBin);
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).destinationBin
      ).toContainText(internalLocation.name);
      await expect(
        putawayDetailsPage.itemStatusTable.row(2).itemStatus
      ).toHaveText('COMPLETED');
      await expect(
        putawayDetailsPage.itemStatusTable.row(2).originBin
      ).toHaveText(receivingBin);
      await expect(
        putawayDetailsPage.itemStatusTable.row(2).destinationBin
      ).toContainText(internalLocation.name);
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
      ).toHaveText(internalLocation.name);
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(internalLocation2.name);
    });
  });

  test('Assert behavior when split into more than 1 line', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    internalLocation2Service,
    putawayDetailsPage,
  }) => {
    const internalLocation = await internalLocationService.getLocation();
    const internalLocation2 = await internalLocation2Service.getLocation();
    await test.step('Go to create putaway page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await RefreshCachesUtils.refreshCaches({
        navbar
      });
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(0).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Split line in putaway', async () => {
      await createPutawayPage.startStep.table.row(0).splitLineButton.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .getPutawayBin(internalLocation2.name);
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.saveButton.click();
    });

    await test.step('Open split modal again and assert validation on empty bin', async () => {
      await createPutawayPage.startStep.table.row(0).splitLineButton.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .clearBinSelect.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .putawayBinField.blur();
      await expect(
        createPutawayPage.startStep.splitModal.table
          .row(1)
          .putawayBinField.first()
          .locator('xpath=ancestor::td')
      ).toHaveClass(/has-error/);
      await expect(
        createPutawayPage.startStep.splitModal.saveButton
      ).toBeDisabled();
    });

    await test.step('Edit putaway bin on split line modal', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .getPutawayBin(internalLocation2.name);
      await expect(
        createPutawayPage.startStep.splitModal.saveButton
      ).toBeEnabled();
      await createPutawayPage.startStep.splitModal.saveButton.click();
    });

    await test.step('Assert split line on start step', async () => {
      await expect(
        createPutawayPage.startStep.table.row(0).splitLineInPutawayBin
      ).toHaveText('Split line');
    });

    await test.step('Delete splitted line and add new line', async () => {
      await createPutawayPage.startStep.table.row(0).splitLineButton.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .deleteButton.click();
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('3');
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .getPutawayBin(internalLocation2.name);
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      await createPutawayPage.startStep.splitModal.table
        .row(3)
        .quantityField.fill('2');
      await createPutawayPage.startStep.splitModal.table
        .row(3)
        .getPutawayBin(internalLocation2.name);

      await createPutawayPage.startStep.splitModal.saveButton.click();
      await expect(
        createPutawayPage.startStep.table.row(0).splitLineInPutawayBin
      ).toHaveText('Split line');
    });

    await test.step('Go to next page and assert split line on complete step', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).putawayBin
      ).toContainText(internalLocation.name);
      await expect(
        createPutawayPage.completeStep.table.row(3).putawayBin
      ).toContainText(internalLocation.name);
      await expect(
        createPutawayPage.completeStep.table.row(4).putawayBin
      ).toContainText(internalLocation.name);
    });

    await test.step('Complete and assert completing putaway', async () => {
      await createPutawayPage.completeStep.completePutawayButton.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert content of items status table', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).itemStatus
      ).toHaveText('COMPLETED');
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).destinationBin
      ).toContainText(internalLocation.name);
      await expect(
        putawayDetailsPage.itemStatusTable.row(2).itemStatus
      ).toHaveText('COMPLETED');
      await expect(
        putawayDetailsPage.itemStatusTable.row(2).destinationBin
      ).toContainText(internalLocation.name);
      await expect(
        putawayDetailsPage.itemStatusTable.row(3).itemStatus
      ).toHaveText('COMPLETED');
      await expect(
        putawayDetailsPage.itemStatusTable.row(3).destinationBin
      ).toContainText(internalLocation.name);
    });
  });
});
