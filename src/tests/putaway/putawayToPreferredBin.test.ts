import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Putaway to preferred bin and default bin', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      receivingService,
      productShowPage,
      productEditPage,
      internalLocationService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      productService.setProduct('5');
      const product = await productService.getProduct();
      productService.setProduct('4');
      const product2 = await productService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: product.id, quantity: 10 },
          { productId: product2.id, quantity: 10 },
        ]
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
        {
          shipmentItemId: getShipmentItemId(receipt, 0, 1),
          quantityReceiving: 10,
          binLocationName: receivingBin,
        },
      ]);
      await receivingService.completeReceipt(shipmentId);

      await productShowPage.goToPage(product2.id);
      await productShowPage.editProductkButton.click();
      await productEditPage.inventoryLevelsTab.click();
      await productEditPage.inventoryLevelsTabSection.createStockLevelButton.click();
      await productEditPage.inventoryLevelsTabSection.createStockLevelModal.receivingTab.click();
      const internalLocation = await internalLocationService.getLocation();
      await productEditPage.inventoryLevelsTabSection.createStockLevelModal.defaultPutawayLocation.click();
      await productEditPage.inventoryLevelsTabSection.createStockLevelModal
        .getDefaultPutawayLocation(internalLocation.name)
        .click();
      await productEditPage.inventoryLevelsTabSection.createStockLevelModal.createButton.click();
    }
  );

  test.afterEach(
    async ({
      stockMovementShowPage,
      stockMovementService,
      navbar,
      transactionListPage,
      oldViewShipmentPage,
      productService,
      productShowPage,
      productEditPage,
    }) => {
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      await transactionListPage.deleteTransaction(1);
      await transactionListPage.deleteTransaction(1);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
      productService.setProduct('4');
      const product2 = await productService.getProduct();
      await productShowPage.goToPage(product2.id);
      await productShowPage.editProductkButton.click();
      await productEditPage.inventoryLevelsTab.click();
      await productEditPage.inventoryLevelsTabSection
        .row(1)
        .editInventoryLevelButton.click();
      await expect(
        productEditPage.inventoryLevelsTabSection.table
      ).toBeVisible();
      await productEditPage.inventoryLevelsTabSection.createStockLevelModal.clickDeleteInventoryLevel();
    }
  );

  test('Create putaway for product with preferred bin assigned and without it', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    productShowPage,
    putawayDetailsPage,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    productService.setProduct('5');
    const product = await productService.getProduct();
    productService.setProduct('4');
    const product2 = await productService.getProduct();
    const internalLocation = await internalLocationService.getLocation();

    await test.step('Go to create putaway page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.table.row(2).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Assert assignment of preferred and putaway bins', async () => {
      await expect(
        createPutawayPage.startStep.table.row(1).getPreferredBin(0)
      ).toHaveText('');
      await expect(
        createPutawayPage.startStep.table.row(2).getPreferredBin(1)
      ).toContainText(internalLocation.name);
      await expect(
        createPutawayPage.startStep.table.row(1).putawayBinSelect
      ).toBeEmpty();
      await expect(
        createPutawayPage.startStep.table.row(2).putawayBinSelect
      ).toContainText(internalLocation.name);
    });

    await test.step('Assert confirm complete putaway dialog when empty putaway bin', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
      await expect(
        createPutawayPage.completeStep.confirmPutawayDialog
      ).toBeVisible();
      await expect(
        createPutawayPage.completeStep.confirmPutawayDialog
      ).toContainText(
        'Are you sure you want to putaway? There are some lines with empty bin locations.'
      );
      await createPutawayPage.completeStep.noButtonOnConfirmPutawayDialog.click();
      await createPutawayPage.completeStep.isLoaded();
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.completeStep.completePutawayButton.click();
      await expect(
        createPutawayPage.completeStep.confirmPutawayDialog
      ).toBeVisible();
      await createPutawayPage.completeStep.yesButtonOnConfirmPutawayDialog.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert putaway bin on stock card', async () => {
      await productShowPage.goToPage(product2.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(internalLocation.name);
      await productShowPage.goToPage(product.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).defaultBinLocation
      ).toBeVisible();
    });
  });

  test('Edit putaway bin when preferred bin assigned automatically', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    internalLocation2Service,
    productShowPage,
    putawayDetailsPage,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    productService.setProduct('4');
    const product2 = await productService.getProduct();
    const internalLocation = await internalLocationService.getLocation();
    const internalLocation2 = await internalLocation2Service.getLocation();

    await test.step('Go to create putaway page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await createPutawayPage.table.row(2).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Assert assignment of preferred and putaway bins', async () => {
      await expect(
        createPutawayPage.startStep.table.row(1).getPreferredBin(0)
      ).toContainText(internalLocation.name);
      await expect(
        createPutawayPage.startStep.table.row(1).putawayBinSelect
      ).toContainText(internalLocation.name);
    });

    await test.step('Edit putaway bin', async () => {
      await createPutawayPage.startStep.table.row(1).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getPutawayBin(internalLocation2.name)
        .click();
    });

    await test.step('Go to next page and assert edited putaway bin', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).getputawayBin(0)
      ).toContainText(internalLocation2.name);
    });

    await test.step('Complete putaway', async () => {
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
      ).toHaveText(internalLocation2.name);
    });

    await test.step('Assert putaway bin on stock card', async () => {
      await productShowPage.goToPage(product2.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(internalLocation2.name);
    });
  });
});
