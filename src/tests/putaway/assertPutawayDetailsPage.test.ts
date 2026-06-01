import path from 'node:path';

import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { PUTAWAY_URL } from '@/consts/applicationUrls';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import { deleteFile, writeBufferToFile } from '@/utils/FileIOUtils';
import { pdfContainsValues } from '@/utils/pdfUtils';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';
import { captureRowValues } from '@/utils/tableUtils';

test.describe('Assert putaway details page', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const downloadedFilePaths: string[] = [];
  let expectedPdfValues: string[] = [];

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      receivingService,
    }) => {
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
    async ({
      stockMovementShowPage,
      stockMovementService,
      navbar,
      transactionListPage,
      oldViewShipmentPage,
    }) => {
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();

      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT,
      });

      while (downloadedFilePaths.length) {
        deleteFile(downloadedFilePaths.pop() as string);
      }
    }
  );

  test('Assert putaway details page', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    putawayDetailsPage,
    putawayListPage,
    page,
    mainLocationService,
    mainUserService,
  }) => {
    const internalLocation = await internalLocationService.getLocation();
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const currentLocation = await mainLocationService.getLocation();
    const mainUser = await mainUserService.getUser();

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
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway', async () => {
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and assert default filtering', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(putawayListPage.orderTypeFilter).toContainText(
        'Putaway Order'
      );
      await expect(putawayListPage.orderTypeFilter).toBeDisabled();
      await expect(putawayListPage.statusFilter).toContainText('Pending');
      await expect(putawayListPage.statusFilter).toBeEnabled();
      await expect(putawayListPage.table.row(1).statusTag).toHaveText(
        'Pending'
      );
      await expect(putawayListPage.destinationFilter).toContainText(
        currentLocation.name
      );
    });

    await test.step('Go to putaway view page and assert page elements', async () => {
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.listOrdersButton).toBeVisible();
      await expect(putawayDetailsPage.createOrderButton).toBeVisible();
      await expect(putawayDetailsPage.showOrderButton).toBeVisible();
      await expect(putawayDetailsPage.editButton).toBeVisible();
      await expect(putawayDetailsPage.addCommentButton).toBeVisible();
      await expect(putawayDetailsPage.addDocumentButton).toBeVisible();
      await expect(putawayDetailsPage.generatePutawayListButton).toBeVisible();
    });

    await test.step('Assert column headers on summary tab', async () => {
      await putawayDetailsPage.summaryTab.click();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Code')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Name')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Quantity')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('UOM')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Unit Price')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Total Amount').nth(1)
      ).toBeVisible();
    });

    await test.step('Assert column headers on items status tab', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Status')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Code')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Product')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Supplier code')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Unit of measure')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Quantity')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader(
          'Serial / Lot Number'
        )
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Expiration date')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Origin Bin')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Destination Bin')
      ).toBeVisible();
    });

    await test.step('Assert content of items status table', async () => {
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).itemStatus
      ).toHaveText('PENDING');
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).originBin
      ).toHaveText(receivingBin);
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).destinationBin
      ).toHaveText(internalLocation.name);
    });

    await test.step('Assert informations on order header', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(
        putawayDetailsPage.orderHeaderTable.statusRowValue
      ).toContainText('Pending');
      await expect(
        putawayDetailsPage.orderHeaderTable.orderTypeValue
      ).toContainText('Putaway Order');
    });

    await test.step('Assert options on summary action menu', async () => {
      await putawayDetailsPage.summaryActionsButton.click();
      await expect(
        putawayDetailsPage.actionsViewOrderDetailsButton
      ).toBeVisible();
      await expect(putawayDetailsPage.actionsAddCommentButton).toBeVisible();
      await expect(putawayDetailsPage.actionsAddDocumentsButton).toBeVisible();
      await expect(
        putawayDetailsPage.actionsGeneratePutawayListButton
      ).toBeVisible();
      await expect(putawayDetailsPage.actionsDeleteButton).toBeVisible();
      await putawayDetailsPage.summaryActionsButton.click();
    });

    const putawayOrderIdentifier =
      await putawayDetailsPage.orderHeaderTable.orderNumberValue.textContent();

    const detailsPagePdfFileName =
      'Putaway ' + `${putawayOrderIdentifier}`.toString().trim() + '.pdf';

    await test.step('Download putaway pdf from details page', async () => {
      await putawayDetailsPage.fileHandler.onDownload();
      await putawayDetailsPage.generatePutawayListButton.click();
      const { fileName, fullFilePath } =
        await putawayDetailsPage.fileHandler.saveFile();
      expect(fileName).toBe(detailsPagePdfFileName);
      downloadedFilePaths.push(fullFilePath);
    });

    await test.step('Assert details page pdf contains table data', async () => {
      const rowCount =
        await putawayDetailsPage.itemStatusTable.orderItemRows.count();
      expect(rowCount).toBeGreaterThan(0);

      expectedPdfValues = await captureRowValues(
        rowCount,
        (i) => putawayDetailsPage.itemStatusTable.orderItemRow(i),
        (r) => r.code,
        (r) => r.productName,
        (r) => r.quantity,
        (r) => r.lotNumber,
        (r) => r.expirationDate,
        (r) => r.destinationBin
      );

      expect(
        await pdfContainsValues(
          downloadedFilePaths[downloadedFilePaths.length - 1],
          expectedPdfValues
        )
      ).toBeTruthy();
    });

    await test.step('Edit pending putaway and reload without losing data', async () => {
      await putawayDetailsPage.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await page.reload();
      await createPutawayPage.startStep.isLoaded();
    });

    const createPagePdfFileNameRegex = new RegExp(
      `^PutawayReport-${`${putawayOrderIdentifier}`.toString().trim()}\\.pdf$`
    );

    await test.step('Download putaway list pdf from create putaway page', async () => {
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

      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(createPagePdfFileNameRegex);

      const fullFilePath = path.join(AppConfig.LOCAL_FILES_DIR_PATH, fileName);
      writeBufferToFile(fullFilePath, await pdfResponse.body());
      downloadedFilePaths.push(fullFilePath);
    });

    await test.step('Assert create putaway page pdf contains table data', async () => {
      expect(
        await pdfContainsValues(
          downloadedFilePaths[downloadedFilePaths.length - 1],
          expectedPdfValues
        )
      ).toBeTruthy();
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
      await expect(
        putawayDetailsPage.orderHeaderTable.statusRowValue
      ).toContainText('Completed');
    });

    await test.step('Assert completed putaway on list putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.clearFilteringButton.click();
      await expect(putawayListPage.destinationFilter).toContainText(
        currentLocation.name
      );
      await putawayListPage.searchField.fill(
        `${putawayOrderIdentifier}`.toString().trim()
      );
      await putawayListPage.searchButton.click();
      await expect(putawayListPage.table.row(1).statusTag).toHaveText(
        'Completed'
      );
    });

    await test.step('Download putaway pdf from putaway list', async () => {
      const generatePutawayPdfFileName =
        'Putaway ' + `${putawayOrderIdentifier}`.toString().trim() + '.pdf';
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.generatePdf.click();
      await putawayDetailsPage.fileHandler.onDownload();
      await putawayDetailsPage.generatePutawayListButton.click();
      const { fileName, fullFilePath } =
        await putawayDetailsPage.fileHandler.saveFile();
      expect(fileName).toBe(generatePutawayPdfFileName);
      downloadedFilePaths.push(fullFilePath);
    });

    await test.step('Assert putaway list pdf contains table data', async () => {
      expect(
        await pdfContainsValues(
          downloadedFilePaths[downloadedFilePaths.length - 1],
          expectedPdfValues
        )
      ).toBeTruthy();
    });

    await test.step('Filter by completed status and ordered by on putaway list page', async () => {
      await putawayListPage.clearFilteringButton.click();
      await putawayListPage.statusFilter.click();
      await putawayListPage.getStatus('Completed');
      await putawayListPage.orderedByFilter.click();
      await putawayListPage.orderedByTextInput.fill(mainUser.name);
      await putawayListPage.getOrderedBy(mainUser.name);
      await putawayListPage.searchButton.click();
    });

    await test.step('Assert filtering not reset when go through pages of results', async () => {
      await expect(putawayListPage.statusFilter).toContainText('Completed');
      await expect(putawayListPage.orderedByFilter).toContainText(
        mainUser.name
      );
      await putawayListPage.nextButton.click();
      await expect(putawayListPage.statusFilter).toContainText('Completed');
      await expect(putawayListPage.orderedByFilter).toContainText(
        mainUser.name
      );
    });
  });
});
