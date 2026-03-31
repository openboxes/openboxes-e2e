import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Assert qty validations in putaways', () => {
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
      putawayListPage,
      stockMovementShowPage,
      stockMovementService,
      oldViewShipmentPage,
    }) => {
      await putawayListPage.goToPage();
      await putawayListPage.table.row(1).actionsButton.click();
      await putawayListPage.table.clickDeleteOrderButton(1);
      await putawayListPage.emptyPutawayList.isVisible();

      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Assert qty validations in putaways', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    productService,
  }) => {
    productService.setProduct('5');
    const internalLocation = await internalLocationService.getLocation();
    await test.step('Go to stock movement show page and assert received status', async () => {
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

    await test.step('Try to edit qty to higher and assert validations', async () => {
      await createPutawayPage.startStep.table.row(0).editButton.click();
      await createPutawayPage.startStep.table.row(0).quantityInput.fill('20');
      await createPutawayPage.startStep.table.row(0).quantityInput.hover();
      await createPutawayPage.startStep.table
        .row(0)
        .assertValidationOnQtyField(
          'Quantity cannot be greater than original putaway item quantity'
        );
      await expect(createPutawayPage.startStep.nextButton).toBeDisabled();
      await expect(createPutawayPage.startStep.saveButton).toBeDisabled();
    });

    await test.step('Try to edit qty to 0 and assert validation', async () => {
      await createPutawayPage.startStep.table.row(0).editButton.click();
      await createPutawayPage.startStep.table.row(0).quantityInput.fill('0');
      await createPutawayPage.startStep.table.row(0).quantityInput.hover();
      await createPutawayPage.startStep.table
        .row(0)
        .assertValidationOnQtyField('Quantity cannot be less than 1');
      await expect(createPutawayPage.startStep.nextButton).toBeDisabled();
      await expect(createPutawayPage.startStep.saveButton).toBeDisabled();
    });

    await test.step('Try to edit qty to negative and assert validation', async () => {
      await createPutawayPage.startStep.table.row(0).editButton.click();
      await createPutawayPage.startStep.table.row(0).quantityInput.fill('-2');
      await createPutawayPage.startStep.table.row(0).quantityInput.hover();
      await createPutawayPage.startStep.table
        .row(0)
        .assertValidationOnQtyField('Quantity cannot be less than 1');
      await expect(createPutawayPage.startStep.nextButton).toBeDisabled();
      await expect(createPutawayPage.startStep.saveButton).toBeDisabled();
    });

    await test.step('Edit ptaway qty back to original value', async () => {
      await createPutawayPage.startStep.table.row(0).editButton.click();
      await createPutawayPage.startStep.table.row(0).quantityInput.fill('10');
      await expect(createPutawayPage.startStep.nextButton).toBeEnabled();
      await expect(createPutawayPage.startStep.saveButton).toBeEnabled();
    });

    await test.step('Open split line modal', async () => {
      await createPutawayPage.startStep.table.row(0).splitLineButton.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .getPutawayBin(internalLocation.name);
    });

    await test.step('Try to edit qty to higher on split line modal', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('20');
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .assertValidationOnQtyField(
          'Sum of all split items quantities cannot be higher than original putaway item quantity'
        );
      await expect(
        createPutawayPage.startStep.splitModal.saveButton
      ).toBeDisabled();
    });

    await test.step('Try to edit qty to 0 and assert validation on split line modal', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('0');
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .assertValidationOnQtyField('Items quantity cannot be less than 1');
      await expect(
        createPutawayPage.startStep.splitModal.saveButton
      ).toBeDisabled();
    });

    await test.step('Try to edit qty to negative and assert validation on split line modal', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('-1');
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .assertValidationOnQtyField('Items quantity cannot be less than 1');
      await expect(
        createPutawayPage.startStep.splitModal.saveButton
      ).toBeDisabled();
    });

    await test.step('Edit qty back to original value', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('10');
      await expect(
        createPutawayPage.startStep.splitModal.saveButton
      ).toBeEnabled();
    });

    await test.step('Add new line on split line modal and assert empty qty on newly added line', async () => {
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .assertValidationOnQtyField('Items quantity cannot be less than 1');
    });

    await test.step('Try to input higher qty on newly added line', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .assertValidationOnQtyField(
          'Sum of all split items quantities cannot be higher than original putaway item quantity'
        );
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .assertValidationOnQtyField(
          'Sum of all split items quantities cannot be higher than original putaway item quantity'
        );
    });

    await test.step('Try to input 0 on newly added line', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('0');
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .assertValidationOnQtyField('Items quantity cannot be less than 1');
    });

    await test.step('Try to input negative qty on newly added line', async () => {
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('-5');
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.hover();
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .assertValidationOnQtyField('Items quantity cannot be less than 1');
    });

    await test.step('Leave split modal', async () => {
      await createPutawayPage.startStep.splitModal.cancelButton.click();
    });
  });
});
