import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Assert attempt to edit completed putaway', () => {
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

      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Assert attempt to edit completed putaway', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    putawayDetailsPage,
    putawayListPage,
    page,
  }) => {
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

    await test.step('Assert try to edit completed putaway', async () => {
      await putawayDetailsPage.assertClickOnEditButtonWhenPutawayCompleted();
    });

    await test.step('Assert delete button is not visible for completed putaway', async () => {
      await putawayDetailsPage.summaryActionsButton.click();
      await expect(putawayDetailsPage.actionsDeleteButton).toBeHidden();
    });

    await test.step('Go backward in browser', async () => {
      await page.goBack();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Assert attemps to edit in completed putaway', async () => {
      await createPutawayPage.startStep.saveButton.click();
      await expect(
        createPutawayPage.startStep.validationOnEditCompletedPutaway
      ).toBeVisible();
      await createPutawayPage.startStep.closeDisplayedError();
      await createPutawayPage.startStep.nextButton.click();
      await expect(
        createPutawayPage.startStep.validationOnEditCompletedPutaway
      ).toBeVisible();
      await createPutawayPage.startStep.closeDisplayedError();
      await createPutawayPage.startStep.generatePutawayListButton.click();
      await expect(
        createPutawayPage.startStep.validationOnEditCompletedPutaway
      ).toBeVisible();
      await createPutawayPage.startStep.closeDisplayedError();
      await createPutawayPage.startStep.sortByCurrentBinButton.click();
      await expect(
        createPutawayPage.startStep.validationOnEditCompletedPutaway
      ).toBeVisible();
      await createPutawayPage.startStep.closeDisplayedError();
    });

    await test.step('Assert attemps to edit item in completed putaway', async () => {
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.table.row(0).deleteButton.click();
      await expect(
        createPutawayPage.startStep.validationOnDeleteItemFromCompletedPutaway
      ).toBeVisible();
      await createPutawayPage.startStep.closeDisplayedError();
      await createPutawayPage.startStep.table.row(0).splitLineButton.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      const internalLocation = await internalLocationService.getLocation();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.saveButton.click();
      await expect(
        createPutawayPage.startStep.validationOnEditCompletedPutaway
      ).toBeVisible();
      await createPutawayPage.startStep.closeDisplayedError();
      await createPutawayPage.startStep.table.row(0).editButton.click();
      await createPutawayPage.startStep.table.row(0).quantityField.fill('20');
      await expect(createPutawayPage.startStep.nextButton).toBeDisabled();
      await expect(createPutawayPage.startStep.saveButton).toBeDisabled();
    });

    await test.step('Go putaway list page and assert pending putaway is not created', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await putawayListPage.emptyPutawayList.isVisible();
    });
  });
});
