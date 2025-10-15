import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Edit destination from send page', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      productService.setProduct('2');
      const PRODUCT_TWO = await productService.getProduct();
      productService.setProduct('3')
      const PRODUCT_THREE = await productService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: PRODUCT_TWO.id, quantity: 100 },
          { productId: PRODUCT_THREE.id, quantity: 200 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(
    async ({ stockMovementShowPage, stockMovementService, authService }) => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
      await authService.changeLocation(AppConfig.instance.locations.main.id);
    }
  );

  test('Edit destination from Send Page', async ({
    stockMovementShowPage,
    createInboundPage,
    depotLocationService,
  }) => {
    const updatedDestination = await depotLocationService.getLocation();

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to Send page od shipped sm and edit destination', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.destinationSelect.findAndSelectOption(
        updatedDestination.name
      );
      await createInboundPage.sendStep.saveAndExitButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert edited destination on show page', async () => {
      await stockMovementShowPage.isLoaded();
      await expect(
        stockMovementShowPage.detailsListTable.destinationValue
      ).toHaveText(updatedDestination.name);
      await expect(stockMovementShowPage.title).toContainText(
        `${updatedDestination.locationNumber}`
      );
    });
  });
});
