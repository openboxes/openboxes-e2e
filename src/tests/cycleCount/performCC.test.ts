import AppConfig from '@/config/AppConfig';
import { DASHBOARD_URL } from '@/constants/applicationUrls';
import { DateFormat } from '@/constants/DateFormats';
import { expect, test } from '@/fixtures/fixtures';
import { formatDate, getToday, parseDate } from '@/utils/DateUtils';

test.describe('Perform cycle count for item', () => {
  let lastStockCountDate: string;
  const productCode = '7';
  const productName = AppConfig.instance.products[productCode].name;
  const facilityId = AppConfig.instance.locations.ccDepot.readId();
  let cycleCountId: string | undefined;

  test.beforeEach(async ({ productShowPage }) => {
    const productId = AppConfig.instance.products[productCode].readId();
    await productShowPage.goToPage(productId);

    const lastStockCountTitle =
      await productShowPage.productStatus.lastStockCountDate.getAttribute(
        'title'
      );
    if (!lastStockCountTitle) {
      throw new Error('Missing title attribute on last stock count element');
    }
    lastStockCountDate = formatDate(
      parseDate(lastStockCountTitle, 'D MMMM YYYY hh:mm A'),
      DateFormat.DISPLAY
    );
  });

  test.afterEach(async ({ cycleCountService }) => {
    if (!cycleCountId) {
      return;
    }
    await cycleCountService.deleteCycleCount(facilityId, cycleCountId);
  });

  test('Perform cycle count for item', async ({
    mainUserService,
    page,
    navbar,
    manageCycleCountPage,
    countStepPage,
    confirmToCountStepPage,
    recountStepPage,
    confirmToRecountStepPage,
    productShowPage,
  }) => {
    const USER = await mainUserService.getUser();

    await test.step('Assert content of inventory menu', async () => {
      await page.goto(DASHBOARD_URL.base);
      await navbar.inventory.click();
      await expect(navbar.getSectionTitle('Cycle Count')).toBeVisible();
      await expect(navbar.getNavItem('Manage Cycle Count')).toBeVisible();
      await expect(navbar.getNavItem('Perform Cycle Count')).toBeVisible();
      await expect(
        navbar.getSectionNavItem('Cycle Count', 'Reporting')
      ).toBeVisible();
    });

    await test.step('Open Manage Cycle count and assert tabs', async () => {
      await manageCycleCountPage.goToPage();
      await manageCycleCountPage.isLoaded();
      await expect(manageCycleCountPage.allProductsTab).toBeVisible();
      await expect(manageCycleCountPage.toCountTab).toBeVisible();
      await expect(manageCycleCountPage.toResolveTab).toBeVisible();
    });

    await test.step('Search for product on All Products tab', async () => {
      await manageCycleCountPage.openAllProductsTab();
      await manageCycleCountPage.searchProduct(productName);
      await expect(manageCycleCountPage.allProductsTable.rows).toHaveCount(1);
    });

    await test.step('Assert Last Counted date on All Products tab matches stock card', async () => {
      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.lastCounted).toHaveText(lastStockCountDate);
    });

    await test.step('Assert product name in table', async () => {
      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.product).toContainText(productName);
    });

    await test.step('Assert category in table', async () => {
      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.category).toHaveText('Anesteshia');
    });

    await test.step('Assert Bin Location in table', async () => {
      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.binLocation).toContainText('CC-BIN-1');

      const tooltip = await row.openBinLocationTooltip();
      await expect(tooltip).toContainText('CC-BIN-1');
      await expect(tooltip).toContainText('(1)');
    });

    await test.step('Select product and mark as To Count', async () => {
      await expect(manageCycleCountPage.markAsToCountButton).toBeDisabled();

      const row = manageCycleCountPage.allProductsTable.row(0);
      await row.checkbox.check();

      await expect(manageCycleCountPage.markAsToCountButton).toBeEnabled();
      await manageCycleCountPage.markAsToCountButton.click();
    });

    await test.step('Assert item shows on To Count tab', async () => {
      await expect(manageCycleCountPage.toCountTab).toHaveClass('active-tab');
      await manageCycleCountPage.toCountTable.isLoaded();
      await expect(manageCycleCountPage.toCountTable.rows).toHaveCount(1);

      const row = manageCycleCountPage.toCountTable.row(0);
      await expect(row.checkbox).toBeChecked();
      await expect(row.product).toContainText(productName);
    });

    await test.step('Start count', async () => {
      await expect(manageCycleCountPage.startCountButton).toBeEnabled();
      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/start/batch')),
        manageCycleCountPage.startCountButton.click(),
      ]);
      const { data } = await response.json();
      cycleCountId = data[0].id;
      await countStepPage.isLoaded();
    });

    await test.step('Assert product code and name in header', async () => {
      await expect(countStepPage.productTitle).toContainText(productCode);
      await expect(countStepPage.productTitle).toContainText(productName);
    });

    await test.step('Assert Date counted is filled with todays date', async () => {
      const today = formatDate(getToday(), DateFormat.DISPLAY);
      await expect(countStepPage.dateCountedValue).toHaveText(today);
      await expect(countStepPage.countedBySelectedValue).toHaveCount(0);
    });

    await test.step('Assert Bin Location and fill Quantity Counted', async () => {
      const row = countStepPage.countStepTable.row(0);
      await expect(row.binLocation).toContainText('CC-BIN-1');

      await expect(row.quantityCountedInput).toHaveValue('');
      await row.fillQuantityCounted('50');

      await countStepPage.nextButton.click();
      await confirmToCountStepPage.isLoaded();
    });

    await test.step('Assert Date counted and Counted by on confirm page', async () => {
      const today = formatDate(getToday(), DateFormat.DISPLAY);
      await expect(confirmToCountStepPage.dateCountedValue).toHaveText(today);
      await expect(confirmToCountStepPage.countedByValue).toContainText(
        USER.firstName
      );
      await expect(confirmToCountStepPage.countedByValue).toContainText(
        USER.lastName
      );
    });

    await test.step('Assert Bin Location and Quantity Counted on confirm page', async () => {
      const row = confirmToCountStepPage.confirmToCountTable.row(0);
      await expect(row.binLocation).toContainText('CC-BIN-1');
      await expect(row.quantityCounted).toHaveText('50');
    });

    await test.step('Save count and resolve discrepancy', async () => {
      await confirmToCountStepPage.saveButton.click();

      const dialog = confirmToCountStepPage.resolveDiscrepancyDialog;
      await dialog.isLoaded();
      await expect(dialog.title).toHaveText('Resolve discrepancies?');
      await expect(dialog.text).toContainText(
        'products with a discrepancy to resolve'
      );

      await dialog.resolveButton.click();
    });

    await test.step('Assign products to recount dialog - skip', async () => {
      const dialog = confirmToCountStepPage.assignToRecountDialog;
      await dialog.isLoaded();

      const row = dialog.row(0);
      await expect(row.product).toContainText(productName);

      await dialog.skipButton.click();
      await recountStepPage.isLoaded();
    });

    await test.step('Assert product code and name in header on recount page', async () => {
      await expect(recountStepPage.productTitle).toContainText(productCode);
      await expect(recountStepPage.productTitle).toContainText(productName);
    });

    await test.step('Assert Date counted, Counted by, Date recounted and Recounted by', async () => {
      const today = formatDate(getToday(), DateFormat.DISPLAY);
      await expect(recountStepPage.dateCountedValue).toHaveText(today);
      await expect(recountStepPage.countedByValue).toContainText(
        USER.firstName
      );
      await expect(recountStepPage.countedByValue).toContainText(USER.lastName);
      await expect(recountStepPage.dateRecountedValue).toHaveText(today);
      await expect(recountStepPage.recountedBySelectedValue).toHaveCount(0);
    });

    await test.step('Assert Bin Location, Quantity Counted and Count Difference in table', async () => {
      const row = recountStepPage.recountStepTable.row(0);
      await expect(row.binLocation).toContainText('CC-BIN-1');
      await expect(row.quantityCounted).toHaveText('50');

      await expect(row.countDifferenceValue).toHaveText('50');
      await expect(row.countDifferenceValue).toHaveCSS(
        'color',
        'rgb(199, 22, 16)'
      );
      await expect(row.countDifferenceIcon).toBeVisible();
    });

    await test.step('Fill Quantity Recounted and assert Recount Difference', async () => {
      const row = recountStepPage.recountStepTable.row(0);
      await row.fillQuantityRecounted('50');

      await expect(row.recountDifferenceValue).toHaveText('50');
      await expect(row.recountDifferenceValue).toHaveCSS(
        'color',
        'rgb(199, 22, 16)'
      );
      await expect(row.recountDifferenceIcon).toBeVisible();
    });

    await test.step('Click Next, validate empty root cause message, click Next again', async () => {
      await recountStepPage.nextButton.click();

      await expect(recountStepPage.emptyRootCauseAlert).toBeVisible();
      await expect(recountStepPage.emptyRootCauseAlert).toContainText(
        'Are you sure you want to continue with empty root cause? Click next if you want to continue.'
      );

      await recountStepPage.closeAlert();
      await recountStepPage.nextButton.click();
      await confirmToRecountStepPage.isLoaded();
    });

    await test.step('Assert product code and name in header on confirm to recount page', async () => {
      await expect(confirmToRecountStepPage.productTitle).toContainText(
        productCode
      );
      await expect(confirmToRecountStepPage.productTitle).toContainText(
        productName
      );
    });

    await test.step('Assert data on confirm to recount page', async () => {
      const today = formatDate(getToday(), DateFormat.DISPLAY);
      await expect(confirmToRecountStepPage.dateCountedValue).toHaveText(today);
      await expect(confirmToRecountStepPage.countedByValue).toContainText(
        USER.firstName
      );
      await expect(confirmToRecountStepPage.countedByValue).toContainText(
        USER.lastName
      );
      await expect(confirmToRecountStepPage.dateRecountedValue).toHaveText(
        today
      );
      await expect(confirmToRecountStepPage.recountedByValue).toContainText(
        USER.firstName
      );
      await expect(confirmToRecountStepPage.recountedByValue).toContainText(
        USER.lastName
      );
    });

    await test.step('Assert table content on confirm to recount page', async () => {
      const row = confirmToRecountStepPage.confirmToRecountTable.row(0);

      await expect(row.binLocation).toContainText('CC-BIN-1');
      await expect(row.quantityCounted).toHaveText('50');

      await expect(row.countDifferenceValue).toHaveText('50');
      await expect(row.countDifferenceValue).toHaveCSS(
        'color',
        'rgb(199, 22, 16)'
      );
      await expect(row.countDifferenceIcon).toBeVisible();

      await expect(row.quantityRecounted).toHaveText('50');

      await expect(row.recountDifferenceValue).toHaveText('50');
      await expect(row.recountDifferenceValue).toHaveCSS(
        'color',
        'rgb(199, 22, 16)'
      );
      await expect(row.recountDifferenceIcon).toBeVisible();

      await expect(row.rootCause).toBeEmpty();
      await expect(row.comment).toBeEmpty();
    });

    await test.step('Save recount and assert redirect to To Resolve tab', async () => {
      await confirmToRecountStepPage.saveButton.click();
      await manageCycleCountPage.isLoaded();
      await expect(manageCycleCountPage.toResolveTab).toHaveClass('active-tab');
    });

    await test.step('Assert Bin Location and qoh on In Stock tab', async () => {
      const productId = AppConfig.instance.products[productCode].readId();
      await productShowPage.goToPage(productId);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();

      const row = productShowPage.inStockTabSection.row(1);
      await expect(row.binLocation).toContainText('CC-BIN-1');
      await expect(row.quantityOnHand).toHaveText('50');
    });

    await test.step('Assert last two transactions on Stock History tab', async () => {
      await productShowPage.stockHistoryTab.click();
      await productShowPage.stockHistoryTabSection.isLoaded();

      const { secondToLast, last } =
        await productShowPage.stockHistoryTabSection.lastTwoRows();

      await expect(secondToLast.transactionLink).toContainText(
        'Inventory Baseline'
      );
      await expect(secondToLast.binLocation).toContainText('CC-BIN-1');
      await expect(secondToLast.count).toHaveText('100');
      await expect(secondToLast.balance).toHaveText('100');

      await expect(last.transactionLink).toContainText('Adjustment');
      await expect(last.binLocation).toContainText('CC-BIN-1');
      await expect(last.debit).toHaveText('50');
      await expect(last.debit).toHaveCSS('color', 'rgb(255, 0, 0)');
      await expect(last.balance).toHaveText('50');
    });

    await test.step('Assert Last Counted date and quantity on All Products tab', async () => {
      // candidates data is fetched once per page load, so a retry must
      // reload the page to see the up-to-date quantityOnHand, not just
      // re-search (same reasoning as BasePageModel.openTab)
      const today = formatDate(getToday(), DateFormat.DISPLAY);
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();
        await manageCycleCountPage.searchProduct(productName);
        await expect(manageCycleCountPage.allProductsTable.rows).toHaveCount(
          1
        );

        const row = manageCycleCountPage.allProductsTable.row(0);
        await expect(row.lastCounted).toHaveText(today);
        await expect(row.quantity).toHaveText('50');
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
    });
  });
});
