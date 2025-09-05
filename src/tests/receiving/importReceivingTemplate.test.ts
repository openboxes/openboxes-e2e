import path from 'node:path';

import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getDateByOffset } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';
import { WorkbookUtils } from '@/utils/WorkbookUtils';

test.describe('Import receiving template', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const workbooks: WorkbookUtils[] = [];
  const lot = uniqueIdentifier.generateUniqueString('lot');
  const RECEIVING_NOW_COLUMN_IDX = 11;
  const COMMENT_COLUMN_IDX = 12;
  const LOT_COLUMN_IDX = 4;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await productService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_ONE.id,
            quantity: 20,
            lotNumber: lot,
            expirationDate: getDateByOffset(new Date(), 3),
          },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    const isButtonVisible =
      await stockMovementShowPage.rollbackLastReceiptButton.isVisible();

    // due to failed test, shipment might not be received which will not show the button
    if (isButtonVisible) {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    }

    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

    for (const workbook of workbooks) {
      workbook.delete();
    }
  });

  test('Receive shipment using import receiving template', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    let filePath: string;
    let downloadedExportTemplateFile: WorkbookUtils;

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Download export template', async () => {
      const { fullFilePath } =
        await receivingPage.receivingStep.downloadExportTemplate();
      filePath = fullFilePath;
    });

    let parsedDocumentData: unknown[][];

    await test.step('Read downloaded file', async () => {
      downloadedExportTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedExportTemplateFile);
    });

    await test.step('Parse csv document to json', async () => {
      parsedDocumentData = downloadedExportTemplateFile.sheetToJSON();
    });

    const data: unknown[][] = [];

    await test.step('Parse downloaded template document', async () => {
      data.push(downloadedExportTemplateFile.getHeaders());
    });

    await test.step('Input receiving now qty into template', async () => {
      const documentRow = parsedDocumentData[1];
      const row = [...documentRow];
      (row[RECEIVING_NOW_COLUMN_IDX] = '20'), (row[COMMENT_COLUMN_IDX] = 'e2e-comment');
      data.push(row);
    });

    const fileName = 'modified.csv';
    const fullFilePath = path.join(AppConfig.LOCAL_FILES_DIR_PATH, fileName);

    await test.step('Save file', async () => {
      const savedFile = WorkbookUtils.saveFile(data, fullFilePath);
      workbooks.push(savedFile);
    });

    await test.step('Upload edited file', async () => {
      await receivingPage.receivingStep.uploadFile(fullFilePath);
    });

    await test.step('Assert inupt values after import file', async () => {
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('20');
      await expect(
        receivingPage.receivingStep.table.row(1).commentField.textbox
      ).toHaveValue('e2e-comment');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });
  });

  test('Display validation when try to edit other fields through import', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    let filePath: string;
    let downloadedExportTemplateFile: WorkbookUtils;

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Download export template', async () => {
      const { fullFilePath } =
        await receivingPage.receivingStep.downloadExportTemplate();
      filePath = fullFilePath;
    });

    let parsedDocumentData: unknown[][];

    await test.step('Read downloaded file', async () => {
      downloadedExportTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedExportTemplateFile);
    });

    await test.step('Parse csv document to json', async () => {
      parsedDocumentData = downloadedExportTemplateFile.sheetToJSON();
    });

    const data: unknown[][] = [];

    await test.step('Parse downloaded template document', async () => {
      data.push(downloadedExportTemplateFile.getHeaders());
    });

    await test.step('Input receiving now qty into template', async () => {
      const documentRow = parsedDocumentData[1];
      const row = [...documentRow];
      (row[LOT_COLUMN_IDX] = 'editlot'), (row[RECEIVING_NOW_COLUMN_IDX] = '20'), (row[COMMENT_COLUMN_IDX] = 'comment');
      data.push(row);
    });

    const fileName = 'modified.csv';
    const fullFilePath = path.join(AppConfig.LOCAL_FILES_DIR_PATH, fileName);

    await test.step('Save file', async () => {
      const savedFile = WorkbookUtils.saveFile(data, fullFilePath);
      workbooks.push(savedFile);
    });

    await test.step('Upload edited file', async () => {
      await receivingPage.receivingStep.uploadFile(fullFilePath);
    });

    await test.step('Assert inupt values after import file', async () => {
      await expect(
        receivingPage.receivingStep.validationOnEditFieldsThroughImport
      ).toBeVisible();
      await receivingPage.receivingStep.isLoaded();
    });
  });
});
