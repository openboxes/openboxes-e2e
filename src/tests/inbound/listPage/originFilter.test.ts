import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Use "Origin" filter', () => {
  let STOCK_MOVEMENT_SUPPLIER: StockMovementResponse;
  let STOCK_MOVEMENT_SUPPLIER_ALT: StockMovementResponse;

  test.beforeEach(
    async ({ stockMovementService, supplierLocation, supplierAltLocation }) => {
      const supplierLocationLocation = await supplierLocation.getLocation();
      const supplierAltLocationLocation =
        await supplierAltLocation.getLocation();

      STOCK_MOVEMENT_SUPPLIER = await stockMovementService.createInbound({
        originId: supplierLocationLocation.id,
      });

      STOCK_MOVEMENT_SUPPLIER_ALT = await stockMovementService.createInbound({
        originId: supplierAltLocationLocation.id,
      });
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT_SUPPLIER.id);
    await stockMovementService.deleteStockMovement(
      STOCK_MOVEMENT_SUPPLIER_ALT.id
    );
  });
  test('Only show stock movements with origin location that is filtered by', async ({
    supplierAltLocation,
    supplierLocation,
    inboundListPage,
  }) => {
    const supplierLocationLocation = await supplierLocation.getLocation();
    const supplierAltLocationLocation = await supplierAltLocation.getLocation();

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by origin of one supplier location', async () => {
      await inboundListPage.filters.originSelect.findAndSelectOption(
        supplierLocationLocation.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    const originColumnsText =
      await inboundListPage.table.allOriginColumnCells.allTextContents();
    const filteredEmptyOriginValues = originColumnsText.filter(
      (it) => !!it.trim()
    );

    expect(filteredEmptyOriginValues.length).toBeGreaterThan(0);
    expect(filteredEmptyOriginValues).toEqual(
      Array(filteredEmptyOriginValues.length).fill(
        supplierLocationLocation.name
      )
    );
    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT_SUPPLIER.identifier
    );
    await expect(inboundListPage.table.table).not.toContainText(
      STOCK_MOVEMENT_SUPPLIER_ALT.identifier
    );

    await test.step('Filter by origin of alternative supplier location', async () => {
      await inboundListPage.filters.originSelect.findAndSelectOption(
        supplierAltLocationLocation.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    const originColumnsTextAltSupplier =
      await inboundListPage.table.allOriginColumnCells.allTextContents();
    const filteredEmptyOriginValuesAltSupplier =
      originColumnsTextAltSupplier.filter((it) => !!it.trim());

    expect(filteredEmptyOriginValuesAltSupplier.length).toBeGreaterThan(0);
    expect(filteredEmptyOriginValuesAltSupplier).toEqual(
      Array(filteredEmptyOriginValuesAltSupplier.length).fill(
        supplierAltLocationLocation.name
      )
    );
    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT_SUPPLIER_ALT.identifier
    );
    await expect(inboundListPage.table.table).not.toContainText(
      STOCK_MOVEMENT_SUPPLIER.identifier
    );
  });
});
