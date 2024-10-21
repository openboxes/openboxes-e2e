import path from 'node:path';

import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getDateByOffset } from '@/utils/DateUtils';
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

    for (const workbook of workbooks) {
      workbook.delete();
    }
  });

  test('Export empty template', async ({ createInboundPage }) => {
    let filePath: string;
    let downloadedTemplateFile: WorkbookUtils;

    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.addItemsStep.isLoaded();
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

    await test.step('Assert template doe snot have any data', async () => {
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
    let filePath: string;
    let downloadedTemplateFile: WorkbookUtils;

    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.addItemsStep.isLoaded();
    });

    const PRODUCT_ONE = await mainProductService.getProduct();
    const PRODUCT_TWO = await otherProductService.getProduct();
    const USER = await mainUserService.getUser();

    const ROWS = [
      {
        packLevel1: 'test-pallet',
        packLevel2: 'test-box',
        productCode: PRODUCT_ONE.productCode,
        productName: PRODUCT_ONE.name,
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: USER.name,
        expirationDate: getDateByOffset(new Date(), 3),
      },
      {
        packLevel1: 'test-pallet',
        packLevel2: 'test-box',
        productCode: PRODUCT_TWO.productCode,
        productName: PRODUCT_TWO.name,
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: USER.name,
        expirationDate: getDateByOffset(new Date(), 3),
      },
    ];

    for (let i = 0; i < ROWS.length; i++) {
      await test.step(`Add item to row ${i} (Add items)`, async () => {
        const data = ROWS[i];
        const row = createInboundPage.addItemsStep.table.row(i);
        await row.packLevel1Field.textbox.fill(data.packLevel1);
        await row.packLevel2Field.textbox.fill(data.packLevel2);
        await row.productSelect.findAndSelectOption(data.productName);
        await row.quantityField.numberbox.fill(data.quantity);
        await row.lotField.textbox.fill(data.lotNumber);
        await row.recipientSelect.findAndSelectOption(data.recipient);

        // eslint-disable-next-line playwright/no-conditional-in-test
        if (i !== ROWS.length - 1) {
          await createInboundPage.addItemsStep.addLineButton.click();
        }
      });
    }

    await test.step('Download template', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();
      filePath = fullFilePath;
    });

    await test.step('Read downloaded template file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedTemplateFile);
    });

    let parsedDocumentData: unknown[][];
    await test.step('Parse csv document to json', async () => {
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
        expect(_.toString(documentRow[1])).toEqual(row.productCode);
        expect(documentRow[2]).toEqual(row.productName);
        expect(documentRow[3]).toEqual(row.packLevel1);
        expect(documentRow[4]).toEqual(row.packLevel2);
        expect(documentRow[5]).toEqual(row.lotNumber);
        expect(documentRow[6]).toBeFalsy();
        expect(_.toString(documentRow[7])).toEqual(row.quantity);
        expect(documentRow[8]).toBeTruthy();
      });
    }
  });

  test('Import filled in template', async ({
    createInboundPage,
    mainProductService,
    otherProductService,
    mainUserService,
  }) => {
    let filePath: string;
    let downloadedTemplateFile: WorkbookUtils;

    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.addItemsStep.isLoaded();
    });

    await test.step('Download template', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();
      filePath = fullFilePath;
    });

    await test.step('Read downloaded template file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedTemplateFile);
    });

    const PRODUCT_ONE = await mainProductService.getProduct();
    const PRODUCT_TWO = await otherProductService.getProduct();
    const USER = await mainUserService.getUser();

    const ROWS = [
      {
        packLevel1: 'test-pallet',
        packLevel2: 'test-box',
        productCode: `${PRODUCT_ONE.productCode}`,
        productName: PRODUCT_ONE.name,
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: USER.id,
        expirationDate: getDateByOffset(new Date(), 3),
      },
      {
        packLevel1: 'test-pallet',
        packLevel2: 'test-box',
        productCode: `${PRODUCT_TWO.productCode}`,
        productName: PRODUCT_TWO.name,
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: USER.id,
        expirationDate: getDateByOffset(new Date(), 3),
      },
    ];

    const data: unknown[][] = [];

    await test.step('Parse downloaded template document', async () => {
      data.push(downloadedTemplateFile.getHeaders());
    });

    for (let i = 0; i < ROWS.length; i++) {
      const entry: unknown[] = [];
      await test.step(`Assert data of exported template on row: ${i}`, async () => {
        const row = ROWS[i];

        entry[0] = '';
        entry[1] = row.productCode;
        entry[2] = row.productName;
        entry[3] = row.packLevel1;
        entry[4] = row.packLevel2;
        entry[5] = row.lotNumber;
        entry[6] = '';
        entry[7] = row.quantity;
        entry[8] = row.recipient;

        data.push(entry);
      });
    }

    const fileName = 'modified.csv';
    const fullFilePath = path.join(AppConfig.DOWNLOADS_DIR_PATRH, fileName);

    await test.step('Save file', async () => {
      const savedFile = WorkbookUtils.saveFile(data, fullFilePath);
      workbooks.push(savedFile);
    });

    await test.step('Upload edited file', async () => {
      await createInboundPage.addItemsStep.uploadFile(fullFilePath);
    });
  });
});
