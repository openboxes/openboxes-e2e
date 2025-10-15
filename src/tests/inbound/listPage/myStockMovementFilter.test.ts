import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse, User } from '@/types';

test.describe('My Stock Movement filter', () => {
  let INBOUND: StockMovementResponse;
  let USER: User;

  test.beforeEach(
    async ({
      supplierLocationService,
      mainUserService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      USER = await mainUserService.getUser();
      productService.setProduct('1');
      const PRODUCT_ONE = await productService.getProduct();
      productService.setProduct('2');
      const PRODUCT_TWO = await productService.getProduct();

      INBOUND = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(INBOUND.id, [
        {
          productId: PRODUCT_ONE.id,
          quantity: 50,
        },
        { productId: PRODUCT_TWO.id, quantity: 100 },
      ]);

      await stockMovementService.sendInboundStockMovement(INBOUND.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementService, stockMovementShowPage }) => {
    await stockMovementShowPage.goToPage(INBOUND.id);
    await stockMovementShowPage.isLoaded();
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(INBOUND.id);
  });

  test('Apply and assert My Stock Movement filter', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
      await inboundListPage.myStockMovementsButton.click();
      await expect(
        inboundListPage.filters.requestedBySelect.field
      ).toContainText(USER.name);
      await expect(inboundListPage.filters.createdBySelect.field).toContainText(
        USER.name
      );
    });

    await test.step('Assert stock movement to be visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        INBOUND.identifier
      );
    });
  });

  test('Sorting by stocklist column should not remove items from table', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Click stocklist header and assert list content', async () => {
      await inboundListPage.table.stocklistColumnHeader.click();
      await expect(inboundListPage.table.table).not.toBeEmpty();
      await expect(inboundListPage.table.table).toContainText(
        INBOUND.identifier
      );
    });
  });
});
