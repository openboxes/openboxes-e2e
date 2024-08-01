import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Search filter', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(async ({ supplierLocationService, stockMovementService }) => {
    const supplierLocation = await supplierLocationService.getLocation();

    STOCK_MOVEMENT = await stockMovementService.createInbound({
      originId: supplierLocation.id,
    });
  });

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Search stock movement by identifier', async ({ inboundListPage }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Search by stock movement identifier', async () => {
      await inboundListPage.filters.searchField.textbox.fill(
        STOCK_MOVEMENT.identifier
      );
      await inboundListPage.search();
    });

    const rowsContent = await inboundListPage.table.rows.allTextContents();
    const filteredRows = rowsContent.filter((it) => !!it.trim());

    expect(filteredRows).toHaveLength(1);
    const firstRow = filteredRows[0];
    expect(firstRow).toContain(STOCK_MOVEMENT.identifier);
    expect(firstRow).toContain(STOCK_MOVEMENT.description);
  });

  test('Execute search filter by pressing Enter key', async ({
    page,
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });
    await test.step('Search inbound by identifier', async () => {
      await inboundListPage.filters.searchField.textbox.fill(
        STOCK_MOVEMENT.identifier
      );
      await inboundListPage.filters.searchField.textbox.focus();
      await Promise.all([
        inboundListPage.waitForResponse(),
        page.keyboard.press('Enter'),
      ]);
    });

    const rowsContent = await inboundListPage.table.rows.allTextContents();
    const filteredRows = rowsContent.filter((it) => !!it.trim());

    expect(filteredRows).toHaveLength(1);
    const firstRow = filteredRows[0];
    expect(firstRow).toContain(STOCK_MOVEMENT.identifier);
    expect(firstRow).toContain(STOCK_MOVEMENT.description);
  });
});
