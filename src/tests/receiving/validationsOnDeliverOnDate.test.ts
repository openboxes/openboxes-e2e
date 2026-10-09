import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { getDateByOffset } from '@/utils/DateUtils';
import { deleteShipment } from '@/utils/shipmentUtils';

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

      const product = await productService.getProduct(Product.ONE);

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 50 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(
    async ({
      stockMovementService,
      locationService,
      mainLocationService,
    }) => {
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await BinLocationUtils.deleteReceivingBin({
        locationService,
        mainLocationService,
        receivingBin,
      });
    }
  );

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
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Edit Delivered on Date on check page to future date', async () => {
      await receivingPage.checkStep.deliveredOnDateField.selectDate(
        getDateByOffset(new Date(), 1)
      );
      await receivingPage.checkStep.deliveredOnDateField.assertHasError();
      await receivingPage.checkStep.deliveredOnDateField.assertErrorTooltip(
        'Delivery date cannot be in the future'
      );
      await expect(
        receivingPage.checkStep.receiveShipmentButton
      ).toBeDisabled();
    });

    await test.step('Change Delivered on Date back to today', async () => {
      await receivingPage.checkStep.deliveredOnDateField.selectDate(new Date());
      await expect(receivingPage.checkStep.receiveShipmentButton).toBeEnabled();
    });
  });

  test('Assert validation on try to edit Delivered on Date to date before shipped date', async ({
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
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Edit Delivered on Date on check page to date before shipped date', async () => {
      // the shipment was shipped today, when the test data was created
      await receivingPage.checkStep.deliveredOnDateField.selectDate(
        getDateByOffset(new Date(), -1)
      );
      await receivingPage.checkStep.deliveredOnDateField.assertHasError();
      await receivingPage.checkStep.deliveredOnDateField.assertErrorTooltip(
        'Delivery date cannot be before the shipped date'
      );
      await expect(
        receivingPage.checkStep.receiveShipmentButton
      ).toBeDisabled();
    });
  });
});
