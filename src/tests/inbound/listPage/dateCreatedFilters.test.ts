import dayjs from 'dayjs';

import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDayOfMonth, getToday } from '@/utils/DateUtils';

test.describe('Date created filters', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(async ({ stockMovementService, supplierLocationService }) => {
    const supplierLocation = await supplierLocationService.getLocation();

    STOCK_MOVEMENT = await stockMovementService.createInbound({
      originId: supplierLocation.id,
    });
  });

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Only stock movements created after filtered date should be visible', async ({
    inboundListPage,
  }) => {
    const TODAY = getToday();

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step(`Filter by created after ${formatDate(TODAY)}`, async () => {
      await inboundListPage.filters.createdAfterDateFilter.click();
      await inboundListPage.filters.createdAfterDateFilter
        .getMonthDay(getDayOfMonth(TODAY))
        .click();
      await inboundListPage.search();
    });

    const dateCreatedColumnsContent =
      await inboundListPage.table.allDateCreatedColumnCells.allTextContents();
    const filteredEmptyDateCreatedValues = dateCreatedColumnsContent
      .filter((it) => !!it.trim())
      .map((it) => dayjs(it).toDate());

    for (const date of filteredEmptyDateCreatedValues) {
      expect(date.getTime()).toBeGreaterThanOrEqual(TODAY.getTime());
    }
  });

  test('Only stock movements created before filtered date should be visible', async ({
    inboundListPage,
  }) => {
    const TODAY = getToday();

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step(`Filter by created before ${formatDate(TODAY)}`, async () => {
      await inboundListPage.filters.createdBeforeDateFilter.click();
      await inboundListPage.filters.createdBeforeDateFilter
        .getMonthDay(getDayOfMonth(TODAY))
        .click();
      await inboundListPage.search();
    });

    const dateCreatedColumnsContent =
      await inboundListPage.table.allDateCreatedColumnCells.allTextContents();
    const filteredEmptyDateCreatedValues = dateCreatedColumnsContent
      .filter((it) => !!it.trim())
      .map((it) => dayjs(it).toDate());

    for (const date of filteredEmptyDateCreatedValues) {
      expect(date.getTime()).toBeLessThan(TODAY.getTime());
    }
  });
});
