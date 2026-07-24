import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
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
      const pastDate = getDateByOffset(new Date(), -1);
      // the date picker re-renders the committed value with seconds zeroed,
      // so fill with :00 to make the value comparable after the commit
      pastDate.setSeconds(0, 0);
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.deliveredOnDateField.fillWithFormat(
        pastDate,
        'MM/DD/YYYY HH:mm:ss Z'
      );
      // when the receive request fires before the date picker commits the
      // value, the shipment gets received with the original valid date and
      // the expected validation never appears
      await expect(
        receivingPage.checkStep.deliveredOnDateField.textbox
      ).toHaveValue(formatDate(pastDate, 'MM/DD/YYYY HH:mm:ss Z'));
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await expect(
        receivingPage.checkStep.validationOnDeliveredOnPastDatePopup
      ).toBeVisible();
    });
  });
});
