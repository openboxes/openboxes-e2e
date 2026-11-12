import { Locator } from '@playwright/test';

import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';

test.describe('Use hyperlinks on CC lists', () => {
  const productCode = '10';
  const productName = AppConfig.instance.products[productCode].name;
  const facilityId = AppConfig.instance.locations.ccDepot.readId();

  let cycleCountId: string | undefined;
  // ids of the "mark as To Count" request(s), set as soon as they're
  // created; only needed as a cleanup fallback if the test fails before
  // Start Count turns them into an actual cycle count
  let pendingRequestIds: string[] = [];

  test.afterEach(async ({ cycleCountService }) => {
    if (cycleCountId) {
      await cycleCountService.deleteCycleCount(facilityId, cycleCountId);
      return;
    }
    if (pendingRequestIds.length) {
      await cycleCountService.deletePendingRequests(
        facilityId,
        pendingRequestIds
      );
    }
  });

  test('Use hyperlinks on CC lists', async ({
    page,
    navbar,
    manageCycleCountPage,
    countStepPage,
    confirmToCountStepPage,
    productShowPage,
  }) => {
    // several candidates-reload retries on top of the normal step time,
    // comfortably over the default 60s test timeout
    test.setTimeout(120_000);

    const productId = AppConfig.instance.products[productCode].readId();
    const stockCardLinkPattern = new RegExp(`showStockCard/${productId}`);

    const getAllProductsRow = () =>
      manageCycleCountPage.allProductsTable.rows.filter({
        hasText: productName,
      });

    const openAllProductsTabAndSearch = async () => {
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();
        await manageCycleCountPage.searchProduct(productName);
        await expect(getAllProductsRow()).toHaveCount(1);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
    };

    const assertNavigatesToStockCard = async (productLink: Locator) => {
      await productLink.click();
      await expect(page).toHaveURL(stockCardLinkPattern);
      await expect(productShowPage.recordStockButton).toBeVisible();
    };

    await test.step('Search product on All Products tab and use its hyperlink to open the stock card', async () => {
      await openAllProductsTabAndSearch();

      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.product).toHaveAttribute('href', stockCardLinkPattern);

      await assertNavigatesToStockCard(row.product);
    });

    await test.step('Mark product as To Count', async () => {
      await openAllProductsTabAndSearch();

      const row = manageCycleCountPage.allProductsTable.row(0);
      await row.checkbox.check();

      const [requestsResponse] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes('/requests/batch') &&
            res.request().method() === 'POST'
        ),
        manageCycleCountPage.markAsToCountButton.click(),
      ]);
      const { data: requestsData } = await requestsResponse.json();
      pendingRequestIds = requestsData.map((item: { id: string }) => item.id);

      await expect(manageCycleCountPage.toCountTab).toHaveClass('active-tab');
    });

    await test.step('Open Perform Cycle Count from the menu and assert product, hyperlink, status and unchecked checkbox on To Count tab', async () => {
      await navbar.inventory.click();
      await expect(navbar.performCycleCount).toBeVisible();
      await page.keyboard.press('Escape');
      await page.mouse.move(0, 0);

      await expect(async () => {
        await manageCycleCountPage.goToPerformCycleCount();
        await manageCycleCountPage.isLoaded();
        await expect(manageCycleCountPage.toCountTab).toHaveClass(
          'active-tab'
        );
        await manageCycleCountPage.toCountTable.isLoaded();
        await manageCycleCountPage.searchProduct(productName);
        await expect(manageCycleCountPage.toCountTable.rows).toHaveCount(1);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });

      const row = manageCycleCountPage.toCountTable.row(0);
      await expect(row.product).toContainText(productName);
      await expect(row.product).toHaveAttribute('href', stockCardLinkPattern);
      await expect(row.status).toHaveText('To count');
      await expect(row.checkbox).not.toBeChecked();
    });

    await test.step('Use the hyperlink on To Count tab to open the stock card', async () => {
      const row = manageCycleCountPage.toCountTable.row(0);
      await assertNavigatesToStockCard(row.product);
    });

    await test.step('Go back, start count with a discrepancy and choose Not now', async () => {
      await expect(async () => {
        await manageCycleCountPage.goToPerformCycleCount();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.toCountTable.isLoaded();
        await manageCycleCountPage.searchProduct(productName);
        await expect(manageCycleCountPage.toCountTable.rows).toHaveCount(1);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
      await manageCycleCountPage.toCountTable.row(0).checkbox.check();

      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/start/batch')),
        manageCycleCountPage.startCountButton.click(),
      ]);
      const { data } = await response.json();
      cycleCountId = data[0].id;
      await countStepPage.isLoaded();
      await expect(async () => {
        await countStepPage.countStepTable.row(0).fillQuantityCounted('40');
        await countStepPage.nextButton.click();
        await confirmToCountStepPage.isLoaded();
      }).toPass({ timeout: 20_000, intervals: [1000, 2000, 3000] });

      await confirmToCountStepPage.saveButton.click();
      const resolveDialog = confirmToCountStepPage.resolveDiscrepancyDialog;
      await resolveDialog.isLoaded();
      await resolveDialog.notNowButton.click();
      await expect(manageCycleCountPage.toResolveTab).toHaveClass(
        'active-tab'
      );
    });

    await test.step('Open To Resolve tab and use its hyperlink to open the stock card', async () => {
      await manageCycleCountPage.toResolveTable.isLoaded();
      await expect(manageCycleCountPage.toResolveTable.rows).toHaveCount(1);

      const row = manageCycleCountPage.toResolveTable.row(0);
      await expect(row.product).toHaveAttribute('href', stockCardLinkPattern);

      await assertNavigatesToStockCard(row.product);
    });
  });
});
