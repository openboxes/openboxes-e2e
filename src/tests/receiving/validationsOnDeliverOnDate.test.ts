import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getDateByOffset } from '@/utils/DateUtils';

test.describe('Validations on edit Deliver On Date when receiving shipment', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await productService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 50 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Assert validation on try to edit Delivered on Date to future date', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Autofill qty and go to check page', async () => {
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await receivingPage.nextButton.click();
    });

    await test.step('Edit Delivered on Date on check page to future date', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.deliveredOnDateField.fillWithFormat(
        getDateByOffset(new Date(), 1),
        'MM/DD/YYYY HH:mm:ss Z'
      );
      await receivingPage.checkStep.deliveredOnDateField.assertHasError();
      await expect(
        receivingPage.checkStep.deliveredOnDateField.errorMessage
      ).toContainText('The date cannot be in the future');
    });
  });

  test('Assert validation on try to edit Delivered on Date to past date', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Autofill qty and go to check page', async () => {
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await receivingPage.nextButton.click();
    });

    await test.step('Edit Delivered on Date on check page to past date', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.deliveredOnDateField.fillWithFormat(
        getDateByOffset(new Date(), -1),
        'MM/DD/YYYY HH:mm:ss Z'
      );
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await expect(
        receivingPage.checkStep.validationOnDeliveredOnPastDatePopup
      ).toBeVisible();
    });
  });
});
