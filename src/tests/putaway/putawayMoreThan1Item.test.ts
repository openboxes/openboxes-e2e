import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Create putaway for more than 1 item, separate putaways', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      fifthProductService,
      fourthProductService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await fifthProductService.getProduct();
      const product2 = await fourthProductService.getProduct();

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
      await transactionListPage.getDeleteTransaction(1);
      await transactionListPage.getDeleteTransaction(1);
      await transactionListPage.getDeleteTransaction(1);
      await transactionListPage.getDeleteTransaction(1);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Create putaway from inbound stock movement for 2 items, 2 separate putaways', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    productShowPage,
    putawayDetailsPage,
    fifthProductService,
    fourthProductService,
    putawayListPage,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await fifthProductService.getProduct();
    const product2 = await fourthProductService.getProduct();
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

    await test.step('Assert default filtering on create putaway page', async () => {
      await expect(createPutawayPage.showByStockMovementFilter).toBeVisible();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getproductName(product.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getproductName(product2.name)
      ).toBeVisible();
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway and save progress', async () => {
      await expect(
        createPutawayPage.startStep.table.row(0).getCurrentBin(receivingBin)
      ).toBeHidden();
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Change default fileting on create putaway page to include lines in pending putaways', async () => {
      await createPutawayPage.goToPage();
      await createPutawayPage.linesInPendingPutawayFilter.click();
      await createPutawayPage.includeLinesInPedningPutawayFilter.click();
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getproductName(product2.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getproductName(product.name)
      ).toBeVisible();
      await expect(createPutawayPage.table.row(2).checkbox).toBeDisabled();
    });

    await test.step('Go to putaway list page and edit created pending putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await putawayListPage.table.row(1).actionsButton.click();
      await putawayListPage.table.viewOrderDetailsButton.click();
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Edit pending putaway and complete it', async () => {
      await putawayDetailsPage.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await expect(
        createPutawayPage.startStep.table.row(0).putawayBinSelect
      ).toHaveText(internalLocation.name);
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Go to create putaway page and start putaway for 2nd item', async () => {
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
      await createPutawayPage.goToPage();
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getproductName(product2.name)
      ).toBeVisible();
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway and complete putaway', async () => {
      await expect(
        createPutawayPage.startStep.table.row(0).getCurrentBin(receivingBin)
      ).toBeHidden();
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
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
    });

    await test.step('Assert empty create putaway page', async () => {
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
      await createPutawayPage.goToPage();
      await expect(createPutawayPage.emptyCreatePageInformation).toBeVisible();
    });
  });
});

test.describe('Putaway 2 items in the same putaway', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      fifthProductService,
      fourthProductService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await fifthProductService.getProduct();
      const product2 = await fourthProductService.getProduct();

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
      await transactionListPage.getDeleteTransaction(1);
      await transactionListPage.getDeleteTransaction(1);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Create putaway from inbound stock movement for 2 items', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    productShowPage,
    putawayDetailsPage,
    fifthProductService,
    fourthProductService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await fifthProductService.getProduct();
    const product2 = await fourthProductService.getProduct();
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

    await test.step('Assert default filtering on create putaway page', async () => {
      await expect(createPutawayPage.showByStockMovementFilter).toBeVisible();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getproductName(product.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getproductName(product2.name)
      ).toBeVisible();
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.table.row(2).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bins to putaway', async () => {
      await createPutawayPage.startStep.table.row(1).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.table.row(2).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(2)
        .getPutawayBin(internalLocation.name)
        .click();
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
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
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(internalLocation.name);
    });

    await test.step('Assert empty create putaway page', async () => {
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
      await createPutawayPage.goToPage();
      await expect(createPutawayPage.emptyCreatePageInformation).toBeVisible();
    });
  });
});
