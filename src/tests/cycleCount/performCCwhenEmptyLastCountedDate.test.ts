import AppConfig from '@/config/AppConfig';
import { DateFormat } from '@/constants/DateFormats';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, parseDate } from '@/utils/DateUtils';
import { deleteShipment, receiveInbound } from '@/utils/shipmentUtils';

test.describe('Perform cycle count when last counted date is empty', () => {
  const productCode = '8';
  const productName = AppConfig.instance.products[productCode].name;
  const facilityId = AppConfig.instance.locations.ccDepot.readId();

  let STOCK_MOVEMENT: StockMovementResponse;
  let cycleCountId: string | undefined;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const productId = AppConfig.instance.products[productCode].readId();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId, quantity: 20 }]
      );

      await receiveInbound(
        { stockMovementService, receivingService },
        STOCK_MOVEMENT,
        [20]
      );
    }
  );

  test.afterEach(async ({ cycleCountService, stockMovementService }) => {
    if (cycleCountId) {
      await cycleCountService.deleteCycleCount(facilityId, cycleCountId);
    }
    await deleteShipment({ stockMovementService, STOCK_MOVEMENT });
  });

  test('Perform cycle count when last counted date is empty', async ({
    page,
    manageCycleCountPage,
    countStepPage,
    confirmToCountStepPage,
    recountStepPage,
    confirmToRecountStepPage,
    productShowPage,
  }) => {
    // the candidates table can receive an unfiltered response in
    // addition to the searched one, occasionally reordering/duplicating
    // rows mid-assertion, so rows are looked up by their own product
    // text instead of by position (row(0)), which can silently start
    // pointing at a different product between two chained assertions
    const getProductRow = () =>
      manageCycleCountPage.allProductsTable.rows.filter({
        hasText: productName,
      });
    const getProductRowCell = (index: number) =>
      getProductRow().locator('.rt-td').nth(index);

    await test.step('Search for product on All Products tab', async () => {
      // the candidates search index can lag behind the receiving done in
      // beforeEach by more than a few seconds, so retry with a full
      // reload (candidates data is fetched once per page load)
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();
        await manageCycleCountPage.searchProduct(productName);
        await expect(getProductRow()).toHaveCount(1);
      }).toPass({ timeout: 60_000, intervals: [2000, 3000, 5000] });
    });

    await test.step('Assert Last Counted date is empty', async () => {
      await expect(getProductRowCell(1)).toBeEmpty();
    });

    await test.step('Assert Bin Location on All Products tab', async () => {
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await expect(getProductRowCell(4)).toContainText(receivingBin);
    });

    await test.step('Select product and mark as To Count', async () => {
      await getProductRowCell(0).getByRole('checkbox').check();
      await manageCycleCountPage.markAsToCountButton.click();
    });

    await test.step('Start count', async () => {
      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/start/batch')),
        manageCycleCountPage.startCountButton.click(),
      ]);
      const { data } = await response.json();
      cycleCountId = data[0].id;
      await countStepPage.isLoaded();
    });

    await test.step('Fill Quantity Counted', async () => {
      const row = countStepPage.countStepTable.row(0);

      // the counted value can silently reset back to empty after being
      // filled (a known quirk of this input, see fillQuantityCounted),
      // which then blocks Next's validation, so refill on every retry
      // instead of just re-clicking Next against a possibly-reset field
      await expect(async () => {
        await row.fillQuantityCounted('50');
        await countStepPage.nextButton.click();
        await confirmToCountStepPage.isLoaded();
      }).toPass({ timeout: 20_000, intervals: [1000, 2000, 3000] });
    });

    await test.step('Save count and resolve discrepancy', async () => {
      await confirmToCountStepPage.saveButton.click();

      const dialog = confirmToCountStepPage.resolveDiscrepancyDialog;
      await dialog.isLoaded();
      await dialog.resolveButton.click();
    });

    await test.step('Assign products to recount dialog - skip', async () => {
      const dialog = confirmToCountStepPage.assignToRecountDialog;
      await dialog.isLoaded();
      await dialog.skipButton.click();
      await recountStepPage.isLoaded();
    });

    await test.step('Assert Count Difference increased', async () => {
      const row = recountStepPage.recountStepTable.row(0);
      await expect(row.countDifferenceValue).toHaveText('30');
      await expect(row.countDifferenceValue).toHaveCSS(
        'color',
        'rgb(19, 173, 96)'
      );
      await expect(row.countDifferenceIcon).toBeVisible();
    });

    await test.step('Fill Quantity Recounted and assert Recount Difference increased', async () => {
      const row = recountStepPage.recountStepTable.row(0);
      await row.fillQuantityRecounted('50');

      await expect(row.recountDifferenceValue).toHaveText('30');
      await expect(row.recountDifferenceValue).toHaveCSS(
        'color',
        'rgb(19, 173, 96)'
      );
      await expect(row.recountDifferenceIcon).toBeVisible();
    });

    await test.step('Click Next, close empty root cause alert, click Next again', async () => {
      await recountStepPage.nextButton.click();
      await expect(recountStepPage.emptyRootCauseAlert).toBeVisible();
      await recountStepPage.closeAlert();
      await recountStepPage.nextButton.click();
      await confirmToRecountStepPage.isLoaded();
    });

    await test.step('Save recount and assert redirect to To Resolve tab', async () => {
      await confirmToRecountStepPage.saveButton.click();
      await manageCycleCountPage.isLoaded();
      await expect(manageCycleCountPage.toResolveTab).toHaveClass('active-tab');
    });

    let lastStockCountDate: string;

    await test.step('Read Last Counted date from stock card', async () => {
      const productId = AppConfig.instance.products[productCode].readId();
      await productShowPage.goToPage(productId);

      const lastStockCountTitle =
        await productShowPage.productStatus.lastStockCountDate.getAttribute(
          'title'
        );
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (!lastStockCountTitle) {
        throw new Error('Missing title attribute on last stock count element');
      }
      lastStockCountDate = formatDate(
        parseDate(lastStockCountTitle, 'D MMMM YYYY hh:mm A'),
        DateFormat.DISPLAY
      );
    });

    await test.step('Assert Last Counted date on All Products tab matches stock card', async () => {
      // candidates data can lag behind the just-saved recount by more
      // than a few seconds, and is fetched once per page load, so a
      // retry must reload the page to see the up-to-date value, not just
      // re-search (same reasoning as BasePageModel.openTab)
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();
        await manageCycleCountPage.searchProduct(productName);
        await expect(getProductRow()).toHaveCount(1);
        await expect(getProductRowCell(1)).toHaveText(lastStockCountDate);
      }).toPass({ timeout: 60_000, intervals: [2000, 3000, 5000] });
    });
  });
});
