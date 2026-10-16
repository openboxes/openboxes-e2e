import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { deleteShipment, receiveInbound } from '@/utils/shipmentUtils';

test.describe('Rollback last receipt validation from other location', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      receivingService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const product = await productService.getProduct(Product.ONE);

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 10 }]
      );

      await receiveInbound(
        { stockMovementService, receivingService },
        STOCK_MOVEMENT,
        [10]
      );
    }
  );

  test.afterEach(
    async ({
      authService,
      stockMovementService,
      locationService,
      mainLocationService,
    }) => {
      await authService.changeLocation(AppConfig.instance.locations.main.id);
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });

      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await BinLocationUtils.deactivateReceivingBin({
        locationService,
        mainLocationService,
        receivingBin,
      });
    }
  );

  test('Rollback last receipt should not be available from other location than destination location', async ({
    stockMovementShowPage,
    navbar,
    locationChooser,
    depotLocationService,
  }) => {
    const OTHER_LOCATION = await depotLocationService.getLocation();

    await test.step('Go to stock movement show page and assert received status', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await expect(
        stockMovementShowPage.rollbackLastReceiptButton
      ).toBeVisible();
    });

    await test.step('Switch to other location', async () => {
      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(OTHER_LOCATION.organization?.name as string)
        .click();
      await locationChooser.getLocation(OTHER_LOCATION.name).click();
      await expect(navbar.locationChooserButton).toContainText(
        OTHER_LOCATION.name
      );
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Rollback last receipt from other location', async () => {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert validation message on stock movement show page', async () => {
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.errorMessage).toBeVisible();
      await expect(stockMovementShowPage.errorMessage).toContainText(
        'To rollback the last receipt of this Stock Movement, please log in to the destination location'
      );
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });
  });
});
