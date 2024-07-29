import GenericService from '@/api/GenericService';
import StockMovementService from '@/api/StockMovementService';
import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse, User } from '@/types';

test.describe('Use "Updated By" filter', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let USER: User;

  test.beforeEach(
    async ({
      genericService,
      supplierLocationService,
      stockMovementService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      USER = await genericService.getLoggedInUser();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        requestorId: USER.id,
        originId: supplierLocation.id,
      });
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test.skip('Only show stock movements updated by filtered user', async ({
    browser,
    inboundListPage,
    mainProduct,
  }) => {
    const product = await mainProduct.getProduct();

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter updated by "main user"', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        USER.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Assert that stock movement is visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.filters.clearButton.click();
      await inboundListPage.waitForResponse();
    });

    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.alternative.storagePath,
    });
    const newPage = await newCtx.newPage();
    const otherSotckMvoementService = new StockMovementService(newPage.request);
    const otherGenericService = new GenericService(newPage.request);

    const otherUser = await otherGenericService.getLoggedInUser();

    await test.step('Filter updated by other user', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        otherUser.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
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
    await newCtx.close();

    await test.step('Clear filters', async () => {
      await inboundListPage.filters.clearButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Filter updated by other user', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        otherUser.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Assert that stock movement is not visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });
});
