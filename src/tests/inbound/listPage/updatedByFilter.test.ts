import StockMovementService from '@/api/StockMovementService';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse, User } from '@/types';

test.describe('Use "Updated By" filter', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let USER: User;
  let USER_ALT: User;

  test.beforeEach(
    async ({
      mainUserService,
      altUserService,
      supplierLocationService,
      stockMovementService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      USER = await mainUserService.getUser();
      USER_ALT = await altUserService.getUser();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        requestorId: USER.id,
        originId: supplierLocation.id,
      });
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Only show stock movements updated by filtered user', async ({
    altUserContext,
    inboundListPage,
    productService,
  }) => {
    const product = await productService.getProduct();

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter updated by "main user"', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        USER.name
      );
      await inboundListPage.search();
    });

    await test.step('Assert that stock movement is visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.clear();
    });

    const newPage = await altUserContext.newPage();
    const otherSotckMvoementService = new StockMovementService(newPage.request);

    await test.step('Filter updated by other user', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        USER_ALT.name
      );
      await inboundListPage.search();
    });

    await test.step('Assert that stock movement is not visible in the table', async () => {
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Update stock movement by other user', async () => {
      await otherSotckMvoementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 2 }]
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.clear();
    });

    await test.step('Filter updated by other user', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        USER_ALT.name
      );
      await inboundListPage.search();
    });

    await test.step('Assert that stock movement is not visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });
});
