import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { deleteShipment, receiveInbound } from '@/utils/shipmentUtils';

test.describe('Perform cycle count when item has negative inventory', () => {
  const productCode = '9';
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

  test.afterEach(
    async ({
      cycleCountService,
      stockMovementService,
      productShowPage,
      transactionService,
    }) => {
      if (cycleCountId) {
        await cycleCountService.deleteCycleCount(facilityId, cycleCountId);
      }
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });

      const productId = AppConfig.instance.products[productCode].readId();
      await productShowPage.goToPage(productId);
      await productShowPage.stockHistoryTab.click();
      await productShowPage.stockHistoryTabSection.isLoaded();

      const rows = productShowPage.stockHistoryTabSection.rows;
      const count = await rows.count();

      const transactionIds: string[] = [];
      for (let i = 2; i < count; i++) {
        const row = productShowPage.stockHistoryTabSection.row(i);
        const links = await row.transactionLink.all();
        for (const link of links) {
          const href = await link.getAttribute('href');
          const id = href?.match(/showTransaction\/(\w+)/)?.[1];
          if (id && !transactionIds.includes(id)) {
            transactionIds.push(id);
          }
        }
      }

      for (const id of transactionIds.reverse()) {
        await transactionService.deleteTransaction(id);
      }
    }
  );

  test('Perform cycle count when item has negative inventory', async ({
    page,
    navbar,
    manageCycleCountPage,
    countStepPage,
    confirmToCountStepPage,
    recountStepPage,
    confirmToRecountStepPage,
    productShowPage,
    ccDepotService,
    transactionService,
  }) => {
    test.setTimeout(120_000);

    const productId = AppConfig.instance.products[productCode].readId();
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    let inboundTransferInRowIndex: number;

    await test.step('Open All Products tab and assert product is not displayed first', async () => {
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();

        const row = manageCycleCountPage.allProductsTable.row(0);
        await expect(row.product).not.toContainText(productName);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
    });

    await test.step('Go to stock card and note the inbound Transfer In transaction', async () => {
      await productShowPage.goToPage(productId);
      await productShowPage.stockHistoryTab.click();
      await productShowPage.stockHistoryTabSection.isLoaded();

      inboundTransferInRowIndex =
        (await productShowPage.stockHistoryTabSection.rows.count()) - 1;
    });

    await test.step('Perform Stock Transfer of inventory from receiving bin to CC-BIN-1', async () => {
      const ccDepot = await ccDepotService.getLocation();

      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();

      const row =
        productShowPage.inStockTabSection.rowByBinLocation(receivingBin);
      await row.actionsButton.click();
      await productShowPage.inStockTabSection.stockTransferButton.click();
      await productShowPage.inStockTabSection.stockTransferDialog.isLoaded();

      await productShowPage.inStockTabSection.stockTransferDialog.locationSelect.click();
      await productShowPage.inStockTabSection.stockTransferDialog.selectLocation(
        ccDepot.name
      );
      await productShowPage.inStockTabSection.stockTransferDialog.binLocationSelect.click();
      await productShowPage.inStockTabSection.stockTransferDialog.selectLocation(
        'CC-BIN-1'
      );
      await productShowPage.inStockTabSection.stockTransferDialog.transferStockButton.click();

      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.rowByBinLocation('CC-BIN-1')
          .binLocation
      ).toContainText('CC-BIN-1');
    });

    await test.step('Delete the Transfer In transaction created by the inbound receipt', async () => {
      await productShowPage.stockHistoryTab.click();
      await productShowPage.stockHistoryTabSection.isLoaded();

      const row = productShowPage.stockHistoryTabSection.row(
        inboundTransferInRowIndex
      );
      const href = await row.transactionLink.getAttribute('href');
      const transactionId = href?.match(/showTransaction\/(\w+)/)?.[1];
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (!transactionId) {
        throw new Error(
          'Could not find id of the inbound Transfer In transaction'
        );
      }
      await transactionService.deleteTransaction(transactionId);
    });

    await test.step('Assert negative inventory in the receiving bin', async () => {
      await productShowPage.goToPage(productId);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();

      const row =
        productShowPage.inStockTabSection.rowByBinLocation(receivingBin);
      await expect(row.quantityOnHand).toHaveText('-20');
    });

    await test.step('Assert product shows first on All Products tab due to negative inv', async () => {
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();

        const row = manageCycleCountPage.allProductsTable.row(0);
        await expect(row.product).toContainText(productName);
        await expect(row.quantity).not.toBeEmpty();
        await expect(row.binLocation).toContainText('CC-BIN-1');
        await expect(row.binLocation).toContainText('CC-BIN-2');
        await expect(row.binLocation).toContainText(receivingBin);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
    });

    await test.step('Assert Negative quantity filter tooltip and apply the filter', async () => {
      const tooltip = await manageCycleCountPage.openNegativeQuantityTooltip();
      await expect(tooltip).toContainText(
        'Returns products with negative inventory items in stock. Unselected for all products.'
      );

      await manageCycleCountPage.negativeQuantityCheckbox.check();
      await manageCycleCountPage.filterButton.click();
      await manageCycleCountPage.allProductsTable.isLoaded();

      await expect(manageCycleCountPage.allProductsTable.rows).toHaveCount(1);
      const row = manageCycleCountPage.allProductsTable.row(0);
      await expect(row.product).toContainText(productName);
      await expect(row.quantity).not.toBeEmpty();
    });

    await test.step('Select item and mark as To Count', async () => {
      const row = manageCycleCountPage.allProductsTable.row(0);
      await row.checkbox.check();
      await manageCycleCountPage.markAsToCountButton.click();
    });

    await test.step('Start count from the To Count tab', async () => {
      await expect(manageCycleCountPage.toCountTab).toHaveClass('active-tab');
      await manageCycleCountPage.toCountTable.isLoaded();

      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/start/batch')),
        manageCycleCountPage.startCountButton.click(),
      ]);
      const body = await response.json();
      cycleCountId = body.data[0].id;
      await countStepPage.isLoaded();
    });

    await test.step('Assert bin locations on count step and fill quantities', async () => {
      await expect(countStepPage.countStepTable.rows).toHaveCount(3);

      const ccBin1Row =
        countStepPage.countStepTable.rowByBinLocation('CC-BIN-1');
      await expect(ccBin1Row.binLocation).toContainText('CC-BIN-1');
      await ccBin1Row.fillQuantityCounted('0');

      const ccBin2Row =
        countStepPage.countStepTable.rowByBinLocation('CC-BIN-2');
      await expect(ccBin2Row.binLocation).toContainText('CC-BIN-2');
      await ccBin2Row.fillQuantityCounted('10');

      const receivingBinRow =
        countStepPage.countStepTable.rowByBinLocation(receivingBin);
      await expect(receivingBinRow.binLocation).toContainText(receivingBin);
      await receivingBinRow.fillQuantityCounted('0');
    });

    await test.step('Save progress and go to Perform Cycle Count', async () => {
      await countStepPage.saveProgressButton.click();
      await navbar.inventory.click();
      await expect(navbar.performCycleCount).toBeVisible();
      await page.keyboard.press('Escape');

      await manageCycleCountPage.goToPerformCycleCount();
      await expect(manageCycleCountPage.toCountTab).toHaveClass('active-tab');
    });

    await test.step('Assert product present on To Count tab with In progress status', async () => {
      await expect(async () => {
        await manageCycleCountPage.goToPerformCycleCount();
        await manageCycleCountPage.toCountTable.isLoaded();
        await expect(manageCycleCountPage.toCountTable.rows).toHaveCount(1);

        const row = manageCycleCountPage.toCountTable.row(0);
        await expect(row.product).toContainText(productName);
        await expect(row.status).toHaveText('In progress');
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
    });

    await test.step('Apply Negative quantity filter on To Count tab', async () => {
      await manageCycleCountPage.negativeQuantityCheckbox.check();
      await manageCycleCountPage.filterButton.click();

      await expect(manageCycleCountPage.toCountTable.rows).toHaveCount(1);
      const row = manageCycleCountPage.toCountTable.row(0);
      await expect(row.product).toContainText(productName);
      await expect(row.quantity).not.toBeEmpty();
    });

    await test.step('Select item and start count again', async () => {
      const row = manageCycleCountPage.toCountTable.row(0);
      await row.checkbox.check();
      await manageCycleCountPage.startCountButton.click();
      await countStepPage.isLoaded();
    });

    await test.step('Assert previously entered quantities were not lost', async () => {
      await expect(async () => {
        await page.reload();
        await countStepPage.isLoaded();

        const ccBin1Row =
          countStepPage.countStepTable.rowByBinLocation('CC-BIN-1');
        await expect(ccBin1Row.quantityCountedInput).toHaveValue('0');

        const ccBin2Row =
          countStepPage.countStepTable.rowByBinLocation('CC-BIN-2');
        await expect(ccBin2Row.quantityCountedInput).toHaveValue('10');

        const receivingBinRow =
          countStepPage.countStepTable.rowByBinLocation(receivingBin);
        await expect(receivingBinRow.quantityCountedInput).toHaveValue('0');
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
    });

    await test.step('Save count and choose Not now on the resolve discrepancies dialog', async () => {
      await countStepPage.nextButton.click();
      await confirmToCountStepPage.isLoaded();
      await confirmToCountStepPage.saveButton.click();

      await confirmToCountStepPage.resolveDiscrepancyDialog.isLoaded();
      await confirmToCountStepPage.resolveDiscrepancyDialog.notNowButton.click();
    });

    await test.step('Assert product present on To Resolve tab with To resolve status', async () => {
      await expect(manageCycleCountPage.toResolveTab).toHaveClass('active-tab');
      await expect(manageCycleCountPage.toResolveTable.rows).toHaveCount(1);

      const row = manageCycleCountPage.toResolveTable.row(0);
      await expect(row.product).toContainText(productName);
      await expect(row.status).toHaveText('To resolve');
    });

    await test.step('Apply Negative quantity filter on To Resolve tab', async () => {
      await manageCycleCountPage.negativeQuantityCheckbox.check();
      await manageCycleCountPage.filterButton.click();

      await expect(manageCycleCountPage.toResolveTable.rows).toHaveCount(1);
      const row = manageCycleCountPage.toResolveTable.row(0);
      await expect(row.product).toContainText(productName);
      await expect(row.quantity).not.toBeEmpty();
    });

    await test.step('Select item and start resolution', async () => {
      const row = manageCycleCountPage.toResolveTable.row(0);
      await row.checkbox.check();
      await manageCycleCountPage.startResolutionButton.click();
      await recountStepPage.isLoaded();
    });

    await test.step('Assert bin locations and quantity counted on recount step, then fill quantity recounted', async () => {
      await expect(recountStepPage.recountStepTable.rows).toHaveCount(3);

      const ccBin1Row =
        recountStepPage.recountStepTable.rowByBinLocation('CC-BIN-1');
      await expect(ccBin1Row.binLocation).toContainText('CC-BIN-1');
      await expect(ccBin1Row.quantityCounted).toHaveText('0');
      await expect(ccBin1Row.countDifferenceValue).toHaveText('20');
      await expect(ccBin1Row.countDifferenceValue).toHaveCSS(
        'color',
        'rgb(199, 22, 16)'
      );
      await expect(ccBin1Row.countDifferenceIcon).toBeVisible();
      await ccBin1Row.fillQuantityRecounted('0');

      const ccBin2Row =
        recountStepPage.recountStepTable.rowByBinLocation('CC-BIN-2');
      await expect(ccBin2Row.binLocation).toContainText('CC-BIN-2');
      await expect(ccBin2Row.quantityCounted).toHaveText('10');
      await expect(ccBin2Row.countDifferenceValue).toHaveText('EQUAL');
      await expect(ccBin2Row.countDifferenceValue).toHaveCSS(
        'color',
        'rgb(0, 82, 204)'
      );
      await expect(ccBin2Row.countDifferenceIcon).toBeHidden();
      await ccBin2Row.fillQuantityRecounted('10');

      const receivingBinRow =
        recountStepPage.recountStepTable.rowByBinLocation(receivingBin);
      await expect(receivingBinRow.binLocation).toContainText(receivingBin);
      await expect(receivingBinRow.quantityCounted).toHaveText('0');
      await expect(receivingBinRow.countDifferenceValue).toHaveText('20');
      await expect(receivingBinRow.countDifferenceValue).toHaveCSS(
        'color',
        'rgb(19, 173, 96)'
      );
      await expect(receivingBinRow.countDifferenceIcon).toBeVisible();
      await receivingBinRow.fillQuantityRecounted('0');
    });

    await test.step('Click Next, validate empty root cause message, click Next again', async () => {
      await recountStepPage.nextButton.click();

      await expect(recountStepPage.emptyRootCauseAlert).toBeVisible();
      await recountStepPage.closeAlert();
      await recountStepPage.nextButton.click();
      await confirmToRecountStepPage.isLoaded();
    });

    await test.step('Save recount to finalize the cycle count', async () => {
      await confirmToRecountStepPage.saveButton.click();
      await manageCycleCountPage.isLoaded();
    });

    await test.step('Assert only one inventory item in stock on the stock card', async () => {
      await productShowPage.goToPage(productId);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();

      await expect(productShowPage.inStockTabSection.rows).toHaveCount(3);
      const row = productShowPage.inStockTabSection.row(1);
      await expect(row.binLocation).toContainText('CC-BIN-2');
      await expect(row.quantityOnHand).toHaveText('10');
    });

    await test.step('Assert product no longer shows first on All Products tab', async () => {
      await expect(async () => {
        await manageCycleCountPage.goToPage();
        await manageCycleCountPage.isLoaded();
        await manageCycleCountPage.openAllProductsTab();

        const row = manageCycleCountPage.allProductsTable.row(0);
        await expect(row.product).not.toContainText(productName);
      }).toPass({ timeout: 30_000, intervals: [2000, 3000, 5000] });
    });

    await test.step('Assert Negative quantity filter now returns an empty table', async () => {
      await manageCycleCountPage.negativeQuantityCheckbox.check();
      await manageCycleCountPage.filterButton.click();

      await expect(manageCycleCountPage.allProductsTable.rows).toHaveCount(0);
    });
  });
});
