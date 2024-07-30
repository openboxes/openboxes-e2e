import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse, User } from '@/types';

test.describe('"Requested By" filter', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  let USER: User;
  let USER_ALT: User;

  test.beforeEach(
    async ({
      supplierLocationService,
      mainUserService,
      altUserService,
      stockMovementService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      USER = await mainUserService.getUser();
      USER_ALT = await altUserService.getUser();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        requestorId: USER_ALT.id,
        originId: supplierLocation.id,
      });
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Only stock movement requested by filtered user should be visible', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter requested by "main user"', async () => {
      await inboundListPage.filters.requestedBySelect.findAndSelectOption(
        USER.name
      );
      await inboundListPage.search();
    });

    await test.step('Assert stock movement not to be visible in the table', async () => {
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.clear();
    });

    await test.step('Filter requested by "other user"', async () => {
      await inboundListPage.filters.requestedBySelect.findAndSelectOption(
        USER_ALT.name
      );
      await inboundListPage.search();
    });

    await test.step('Assert stock movement to be visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });
});
