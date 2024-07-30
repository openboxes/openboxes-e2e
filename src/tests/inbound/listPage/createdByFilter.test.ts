import StockMovementService from '@/api/StockMovementService';
import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse, User } from '@/types';

test.describe('Use "Created By" filter', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let STOCK_MOVEMENT_OTHER: StockMovementResponse;

  let USER: User;
  let USER_ALT: User;

  test.beforeEach(
    async ({
      browser,
      stockMovementService,
      supplierLocationService,
      mainUserService,
      altUserService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      USER = await mainUserService.getUser();
      USER_ALT = await altUserService.getUser();

      await test.step('Create stock movement for main user', async () => {
        STOCK_MOVEMENT = await stockMovementService.createInbound({
          requestorId: USER.id,
          originId: supplierLocation.id,
        });
      });

      const newCtx = await browser.newContext({
        storageState: AppConfig.instance.users.alternative.storagePath,
      });
      const newPage = await newCtx.newPage();

      await test.step('Create stock movement with alternative user', async () => {
        const otherSotckMvoementService = new StockMovementService(
          newPage.request
        );
        STOCK_MOVEMENT_OTHER = await otherSotckMvoementService.createInbound({
          requestorId: USER.id,
          originId: supplierLocation.id,
        });
      });
      await newCtx.close();
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT_OTHER.id);
  });

  test('Only stock movements created by filtered user should be visible', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by main user', async () => {
      await inboundListPage.filters.createdBySelect.findAndSelectOption(
        USER.name
      );
      await inboundListPage.search();

      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT_OTHER.identifier
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.clear();
    });

    await test.step('Filter by alternative user', async () => {
      await inboundListPage.filters.createdBySelect.findAndSelectOption(
        USER_ALT.name
      );
      await inboundListPage.search();

      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT_OTHER.identifier
      );
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });
});
