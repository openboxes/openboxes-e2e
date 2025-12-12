import path from 'node:path';

import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import {
  CreateInboundAddItemsTableEntity,
  StockMovementResponse,
} from '@/types';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
import { transformJsonToArrayTemplateRow } from '@/utils/templateDocumentUtils';
import { WorkbookUtils } from '@/utils/WorkbookUtils';

test.describe('Export items template on inbound add items page', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const workbooks: WorkbookUtils[] = [];

  test.beforeEach(async ({ stockMovementService, supplierLocationService }) => {
    const supplierLocation = await supplierLocationService.getLocation();

    STOCK_MOVEMENT = await stockMovementService.createInbound({
      originId: supplierLocation.id,
    });
  });

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

    // Dispose of the downloaded and created files at the end of the test
    for (const workbook of workbooks) {
      workbook.delete();
    }
  });

  test('Export empty template', async ({ createInboundPage }) => {
    let filePath: string;
    let downloadedTemplateFile: WorkbookUtils;

    await test.step('Go to inbound add items page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.addItemsStep.waitForNetworkIdle();
    });

    await test.step('Download template', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();
      filePath = fullFilePath;
    });

    await test.step('Read file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedTemplateFile);
    });

    await test.step('Assert template does not have any data', async () => {
      expect(downloadedTemplateFile.getData()).toHaveLength(1);
      expect(downloadedTemplateFile.getData()[0]).toHaveLength(0);
    });

    await test.step('Assert template columns', async () => {
      expect(downloadedTemplateFile.getHeaders()).toStrictEqual([
        'Requisition item id',
        'Product code (required)',
        'Product name',
        'Pack level 1',
        'Pack level 2',
        'Lot number',
        'Expiration date (MM/dd/yyyy)',
        'Quantity (required)',
        'Recipient id',
      ]);
    });
  });

  test('Downloaded template should contain all added items', async ({
    createInboundPage,
    mainProductService,
    otherProductService,
    mainUserService,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    const PRODUCT_ONE = await mainProductService.getProduct();
    const PRODUCT_TWO = await otherProductService.getProduct();
    const USER = await mainUserService.getUser();

    const ROWS = [
      {
        palletName: 'test-pallet',
        boxName: 'test-box',
        product: {
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
        },
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: USER,
        expirationDate: getDateByOffset(new Date(), 3),
      },
      {
        palletName: 'test-pallet',
        boxName: 'test-box',
        product: {
          productCode: PRODUCT_TWO.productCode,
          productName: PRODUCT_TWO.name,
        },
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: USER,
        expirationDate: getDateByOffset(new Date(), 3),
      },
    ];

    await createInboundPage.addItemsStep.addItems(ROWS);

    let parsedDocumentData: unknown[][];

    await test.step('Download and read template file', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();

      const downloadedTemplateFile = WorkbookUtils.read(fullFilePath);
      workbooks.push(downloadedTemplateFile);

      parsedDocumentData = downloadedTemplateFile.getData();
    });

    await test.step('Assert exported item count in the template', async () => {
      expect(parsedDocumentData).toHaveLength(2);
    });

    for (let i = 0; i < ROWS.length; i++) {
      await test.step(`Assert data of exported template on row: ${i}`, async () => {
        const documentRow = parsedDocumentData[i];
        const row = ROWS[i];

        expect(documentRow[0]).toBeTruthy();
        expect(_.toString(documentRow[1])).toEqual(row.product?.productCode);
        expect(documentRow[2]).toEqual(row.product?.productName);
        expect(documentRow[3]).toEqual(row.palletName);
        expect(documentRow[4]).toEqual(row.boxName);
        expect(documentRow[5]).toEqual(row.lotNumber);
        expect(documentRow[6]).toEqual(formatDate(row.expirationDate));
        expect(_.toString(documentRow[7])).toEqual(row.quantity);
        expect(documentRow[8]).toBeTruthy();
      });
    }
  });
});

test.describe('Import template with data', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const workbooks: WorkbookUtils[] = [];

  test.beforeEach(async ({ stockMovementService, supplierLocationService }) => {
    const supplierLocation = await supplierLocationService.getLocation();

    STOCK_MOVEMENT = await stockMovementService.createInbound({
      originId: supplierLocation.id,
    });
  });

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

    // Dispose of the downloaded and created files at the end of the test
    for (const workbook of workbooks) {
      workbook.delete();
    }
  });

  test('Import filled template on an empty table', async ({
    createInboundPage,
    mainProductService,
    otherProductService,
    mainUserService,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.addItemsStep.waitForNetworkIdle();
    });

    let downloadedTemplateFile: WorkbookUtils;
    await test.step('Download and read template', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();

      downloadedTemplateFile = WorkbookUtils.read(fullFilePath);
      workbooks.push(downloadedTemplateFile);
    });

    const PRODUCT_ONE = await mainProductService.getProduct();
    const PRODUCT_TWO = await otherProductService.getProduct();
    const USER = await mainUserService.getUser();

    const ROWS = [
      {
        palletName: 'test-pallet',
        boxName: 'test-box',
        product: {
          productCode: `${PRODUCT_ONE.productCode}`,
          productName: PRODUCT_ONE.name,
        },
        quantity: 12,
        lotNumber: 'E2E-lot-test',
        recipient: USER,
        expirationDate: getDateByOffset(new Date(), 3),
      },
      {
        palletName: 'test-pallet',
        boxName: 'test-box',
        product: {
          productCode: `${PRODUCT_TWO.productCode}`,
          productName: PRODUCT_TWO.name,
        },
        quantity: 13,
        lotNumber: 'E2E-lot-test',
        recipient: USER,
        expirationDate: getDateByOffset(new Date(), 3),
      },
    ];

    const data: unknown[][] = [];

    await test.step('Parse downloaded template document', async () => {
      data.push(downloadedTemplateFile.getHeaders());
    });

    for (let i = 0; i < ROWS.length; i++) {
      await test.step(`Add data to exported template on row: ${i}`, async () => {
        const rowEntry = transformJsonToArrayTemplateRow(ROWS[i]);
        data.push(rowEntry);
      });
    }

    const fileName = 'modified.csv';
    const fullFilePath = path.join(AppConfig.LOCAL_FILES_DIR_PATH, fileName);

    await test.step('Save file', async () => {
      const savedFile = WorkbookUtils.saveFile(data, fullFilePath);
      workbooks.push(savedFile);
    });

    await test.step('Upload edited file', async () => {
      await createInboundPage.addItemsStep.uploadFile(fullFilePath);
    });

    await createInboundPage.addItemsStep.assertTableRows(ROWS);
  });

  test.skip('Update existing values with template import', async ({
    createInboundPage,
    otherProductService,
    mainProductService,
    altUserService,
    mainUserService,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.addItemsStep.waitForNetworkIdle();
    });

    await test.step('Add items to table', async () => {
      const PRODUCT_ONE = await mainProductService.getProduct();
      const USER = await mainUserService.getUser();

      const ROWS = [
        {
          palletName: 'test-pallet',
          boxName: 'test-box',
          product: {
            productCode: PRODUCT_ONE.productCode,
            productName: PRODUCT_ONE.name,
          },
          quantity: '12',
          lotNumber: 'E2E-lot-test',
          recipient: USER,
          expirationDate: getDateByOffset(new Date(), 3),
        },
      ];

      await createInboundPage.addItemsStep.addItems(ROWS);
    });

    let downloadedTemplateFile: WorkbookUtils;
    await test.step('Download and read template', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();

      downloadedTemplateFile = WorkbookUtils.read(fullFilePath);
      workbooks.push(downloadedTemplateFile);
    });

    let parsedDocumentData: unknown[][];
    await test.step('Parse csv document to json', async () => {
      parsedDocumentData = downloadedTemplateFile.sheetToJSON();
    });

    const PRODUCT_TWO = await otherProductService.getProduct();
    const ALT_USER = await altUserService.getUser();

    const NEW_ROW = {
      palletName: 'new test-pallet',
      boxName: 'new test-box',
      product: {
        productCode: PRODUCT_TWO.productCode,
        productName: PRODUCT_TWO.name,
      },
      quantity: '19',
      lotNumber: 'edited E2E-lot-test',
      recipient: ALT_USER,
      expirationDate: getDateByOffset(new Date(), 3),
    };

    await test.step('Update data on exported template', async () => {
      // first array element is a list of headers,
      // so we need a second one (index: 1) to acccess first row of values
      parsedDocumentData[1] = transformJsonToArrayTemplateRow(
        NEW_ROW,
        parsedDocumentData[1][0] as string
      );
    });

    const fileName = `${STOCK_MOVEMENT.identifier}-update-values.csv`;
    const fullFilePath = path.join(AppConfig.LOCAL_FILES_DIR_PATH, fileName);

    await test.step('Save file', async () => {
      const savedFile = WorkbookUtils.saveFile(
        parsedDocumentData,
        fullFilePath
      );
      workbooks.push(savedFile);
    });

    await test.step('Upload edited file', async () => {
      await createInboundPage.addItemsStep.uploadFile(fullFilePath);
    });

    await createInboundPage.addItemsStep.assertTableRows([NEW_ROW]);
  });

  test('Add new row to with existing items in the table', async ({
    createInboundPage,
    otherProductService,
    mainProductService,
    altUserService,
    mainUserService,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    let ROW: CreateInboundAddItemsTableEntity;
    await test.step('Add items to table', async () => {
      const PRODUCT_ONE = await mainProductService.getProduct();
      const USER = await mainUserService.getUser();

      ROW = {
        palletName: 'test-pallet',
        boxName: 'test-box',
        product: {
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
        },
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: USER,
        expirationDate: getDateByOffset(new Date(), 3),
      };

      await createInboundPage.addItemsStep.addItems([ROW]);
    });

    let downloadedTemplateFile: WorkbookUtils;
    let parsedDocumentData: unknown[][];

    await test.step('Download template', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();

      downloadedTemplateFile = WorkbookUtils.read(fullFilePath);
      workbooks.push(downloadedTemplateFile);

      parsedDocumentData = downloadedTemplateFile.sheetToJSON();
    });

    const PRODUCT_TWO = await otherProductService.getProduct();
    const ALT_USER = await altUserService.getUser();

    const NEW_ROW = {
      palletName: 'new test-pallet',
      boxName: 'new test-box',
      product: {
        productCode: PRODUCT_TWO.productCode,
        productName: PRODUCT_TWO.name,
      },
      quantity: '19',
      lotNumber: 'edited E2E-lot-test',
      recipient: ALT_USER,
      expirationDate: getDateByOffset(new Date(), 3),
    };

    await test.step('Update data on exported template', async () => {
      const newRowValues = transformJsonToArrayTemplateRow(NEW_ROW);
      parsedDocumentData.push(newRowValues);
    });

    const fileName = `${STOCK_MOVEMENT.identifier}-added-new-value.csv`;
    const fullFilePath = path.join(AppConfig.LOCAL_FILES_DIR_PATH, fileName);

    await test.step('Save file', async () => {
      const savedFile = WorkbookUtils.saveFile(
        parsedDocumentData,
        fullFilePath
      );
      workbooks.push(savedFile);
    });

    await test.step('Upload edited file', async () => {
      await createInboundPage.addItemsStep.uploadFile(fullFilePath);
    });

    await test.step('Assert table row values', async () => {
      await createInboundPage.addItemsStep.assertTableRows([ROW, NEW_ROW]);
    });
  });
});
