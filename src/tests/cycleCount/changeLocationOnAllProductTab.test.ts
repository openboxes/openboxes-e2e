import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { deleteShipment, receiveInbound } from '@/utils/shipmentUtils';

test.describe('Change location on All Products tab', () => {
  const productCode = '8';
  const productName = AppConfig.instance.products[productCode].name;

  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({ supplierLocationService, stockMovementService, receivingService }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const productId = AppConfig.instance.products[productCode].readId();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });
      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId, quantity: 15 }]
      );
      await receiveInbound(
        { stockMovementService, receivingService },
        STOCK_MOVEMENT,
        [15]
      );
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await deleteShipment({ stockMovementService, STOCK_MOVEMENT });
  });

  test('Change location on All Products tab', async ({
    page,
    manageCycleCountPage,
    depotLocationService,
    ccDepotService,
  }) => {
    // several filter-apply/reload retries on top of the normal step time,
    // comfortably over the default 60s test timeout
    test.setTimeout(120_000);

    const binLocationName =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;

    const applyBinLocationFilter = async () => {
      await manageCycleCountPage.selectBinLocationFilter(binLocationName);
      await manageCycleCountPage.filterButton.click();
      await manageCycleCountPage.allProductsTable.isLoaded();
    };

    await test.step('Filter All Products tab by the new Bin Location and select the product', async () => {
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();
        await applyBinLocationFilter();
        await expect(manageCycleCountPage.allProductsTable.rows).toHaveCount(1);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });

      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.product).toContainText(productName);
      // the All Products tab's Bin Location column renders the name in
      // lowercase, unlike the real Location.name or the filter's own options
      await expect(row.binLocation).toContainText(
        new RegExp(binLocationName, 'i')
      );

      await row.checkbox.check();
      await expect(manageCycleCountPage.markAsToCountButton).toBeEnabled();
    });

    await test.step('Switch to depot location and assert the Bin Location filter is empty', async () => {
      await depotLocationService.switchLocation();
      await manageCycleCountPage.goToPage();
      await manageCycleCountPage.isLoaded();
      await manageCycleCountPage.openAllProductsTab();

      await expect(manageCycleCountPage.binLocationSelectHasValue).toHaveCount(0);
    });

    await test.step('Assert the product is not selected and not present on All Products tab in depot', async () => {
      await expect(
        manageCycleCountPage.allProductsTable.rows.filter({ hasText: productName })
      ).toHaveCount(0);
      await expect(manageCycleCountPage.markAsToCountButton).toBeDisabled();
    });

    await test.step('Assert the new Bin Location is not selectable in the filter in depot', async () => {
      await manageCycleCountPage.binLocationSelect.click();
      await manageCycleCountPage.binLocationSelect
        .getByRole('textbox')
        .fill(binLocationName);
      await expect(
        manageCycleCountPage.getBinLocationOption(binLocationName)
      ).toHaveCount(0);
    });

    await test.step('Switch back to the CC location and reapply the Bin Location filter', async () => {
      await ccDepotService.switchLocation();

      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();
        await applyBinLocationFilter();
        await expect(manageCycleCountPage.allProductsTable.rows).toHaveCount(1);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });

      await expect(manageCycleCountPage.binLocationSelectHasValue).toBeVisible();
    });

    await test.step('Reload the page and assert the Bin Location filter value is not reset', async () => {
      await expect(async () => {
        await page.reload();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.allProductsTable.isLoaded();
        await expect(manageCycleCountPage.allProductsTable.rows).toHaveCount(1);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });

      await expect(manageCycleCountPage.binLocationSelectHasValue).toBeVisible();
      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.product).toContainText(productName);
    });
  });
});
