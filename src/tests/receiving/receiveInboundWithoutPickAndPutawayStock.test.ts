import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import { getToday } from '@/utils/DateUtils';
import { deleteShipment } from '@/utils/shipmentUtils';

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
      const noPickAndPutawayStockDepot =
        await noPickAndPutawayStockDepotService.getLocation();
      const PRODUCT_ONE = await productService.getProduct(Product.ONE);

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        destinationId: noPickAndPutawayStockDepot.id,
        description,
        dateRequested,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: PRODUCT_ONE.id, quantity: 200 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ authService, stockMovementService }) => {
    // the shipment must be deleted while the session is still at the depot,
    // but the location has to be restored even when the cleanup fails,
    // otherwise the next test file runs against the wrong location
    try {
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });
    } finally {
      await authService.changeLocation(AppConfig.instance.locations.main.id);
    }
  });

  test('Receive sm in location without pick and putaway stock', async ({
    stockMovementShowPage,
    receivingPage,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(
        AppConfig.instance.locations.noPickAndPutawayStockDepot.id
      );
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert table column headers on receiving page', async () => {
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep('Code');
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Product'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Shipped'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Status'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Actions'
      );
    });

    await test.step('Autofill receiving qty', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click({
        force: true,
      });
    });

    await test.step('Go to and assert checking page is visible', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Assert table column headers on checking page', async () => {
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep('Code');
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Product'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Shipped'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep('Status');
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Actions'
      );
      // a location without pick/putaway support has no per-line bin
      // location concept (everything lands in a single "Default" bin), so
      // there's no "Location" or "Cancel Remaining" column here either.
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Default bin on Packing list', async () => {
      await stockMovementShowPage.packingListTable.isLoaded();
      await expect(
        stockMovementShowPage.packingListTable.row(1).binLocation
      ).toHaveText('Default');
    });
  });
});
