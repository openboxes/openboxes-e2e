import path from 'node:path';

import AppConfig from '@/config/AppConfig';
import { PUTAWAY_URL } from '@/constants/applicationUrls';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import { deleteFile, writeBufferToFile } from '@/utils/FileIOUtils';
import { extractPdfColumnValues } from '@/utils/pdfUtils';
import { cleanupPendingPutaways } from '@/utils/putawayUtils';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';

test.describe('Putaway received inbound shipment', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let PUTAWAY_ORDER_IDS: string[] = [];
  const downloadedFilePaths: string[] = [];

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      receivingService,
    }) => {
      PUTAWAY_ORDER_IDS = [];
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await productService.getProduct(Product.FIVE);

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 10 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });

      const { data: stockMovement } =
        await stockMovementService.getStockMovement(STOCK_MOVEMENT.id);
      const shipmentId = getShipmentId(stockMovement);
      const { data: receipt } = await receivingService.getReceipt(shipmentId);
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;

      await receivingService.createReceivingBin(shipmentId, receipt);

      await receivingService.updateReceivingItems(shipmentId, [
        {
          shipmentItemId: getShipmentItemId(receipt, 0, 0),
          quantityReceiving: 10,
          binLocationName: receivingBin,
        },
      ]);
      await receivingService.completeReceipt(shipmentId);
    }
  );

  test.afterEach(
    async (
      { stockMovementService, transactionService, putawayService },
      testInfo
    ) => {
      const { allPutawaysCompleted } = await cleanupPendingPutaways({
        putawayService,
        putawayOrderIds: PUTAWAY_ORDER_IDS,
        testInfo,
      });

      if (allPutawaysCompleted) {
        await transactionService.deleteRecentTransactions(2);
      }

      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });

      while (downloadedFilePaths.length) {
        deleteFile(downloadedFilePaths.pop() as string);
      }
    }
  );

  test('Create putaway from inbound stock movement', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    productShowPage,
    putawayDetailsPage,
    productService,
    page,
  }) => {
    const internalLocation = await internalLocationService.getLocation();

    await test.step('Go to stock movement show page and assert received status', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
    });

    await test.step('Go to create putaway page', async () => {
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(0).checkbox.click();
      PUTAWAY_ORDER_IDS.push(await createPutawayPage.startPutaway());
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway', async () => {
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
    });

    const downloadPutawayListPdf = async () => {
      const pdfResponsePromise = page.waitForResponse(
        (resp) =>
          PUTAWAY_URL.generatePdfPattern.test(resp.url()) &&
          resp.status() === 200
      );
      const downloadPromise = page.waitForEvent('download');
      await createPutawayPage.startStep.generatePutawayListButton.click();
      const [pdfResponse, download] = await Promise.all([
        pdfResponsePromise,
        downloadPromise,
      ]);

      const fullFilePath = path.join(
        AppConfig.LOCAL_FILES_DIR_PATH,
        download.suggestedFilename()
      );
      writeBufferToFile(fullFilePath, await pdfResponse.body());
      downloadedFilePaths.push(fullFilePath);
      return fullFilePath;
    };

    await test.step('Generate putaway pdf', async () => {
      const pdfFilePath = await downloadPutawayListPdf();
      expect(await extractPdfColumnValues(pdfFilePath, 'Putaway Bin')).toEqual([
        internalLocation.name,
      ]);
    });

    await test.step('Go to next page', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
    });

    await test.step('Go back to start step', async () => {
      await createPutawayPage.completeStep.editButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Generate putaway pdf again', async () => {
      const pdfFilePath = await downloadPutawayListPdf();
      expect(await extractPdfColumnValues(pdfFilePath, 'Putaway Bin')).toEqual([
        internalLocation.name,
      ]);
    });

    await test.step('Go to next page and complete putaway', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert putaway bin on stock card', async () => {
      await putawayDetailsPage.summaryTab.click();
      const product = await productService.getProduct(Product.FIVE);
      await productShowPage.goToPage(product.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(internalLocation.name);
    });
  });
});
