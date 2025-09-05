import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getToday } from '@/utils/DateUtils';

test.describe('Receive inbound stock movement in location without pick and putaway stock', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      noPickAndPutawayStockDepotService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const noPickAndPutawayStockDepot= await noPickAndPutawayStockDepotService.getLocation();
      const PRODUCT_ONE = await productService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        destinationId: noPickAndPutawayStockDepot.id,
        description,
        dateRequested,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: PRODUCT_ONE.id, quantity: 200 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(
    async ({ stockMovementShowPage, authService }) => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.rollbackLastReceiptButton.click();
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementShowPage.clickDeleteShipment();

      await authService.changeLocation(AppConfig.instance.locations.main.id);
    }
  );

  test('Receive sm in location without pick and putaway stock', async ({
    stockMovementShowPage,
    receivingPage,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.noPickAndPutawayStockDepot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert table column headers on receiving page', async () => {
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Pack level 1'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Pack level 2'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Code');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Product');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Lot/Serial No.'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Expiration date'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Recipient');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Shipped');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Received');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('To receive');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Comment');
    });


    await test.step('Autofill receiving qty', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
    });


    await test.step('Go to and assert checking page is visible', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Assert table column headers on checking page', async () => {
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Pack level 1'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Pack level 2'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Code');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Product');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Lot/Serial No.'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Expiration date'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Recipient');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Remaining');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Cancel remaining');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Comment');
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Default bin on Packing list', async () => {
        await expect(stockMovementShowPage.packingListTable.row(1).binLocation).toHaveText('Default');
      });

  });


});
