import _ from 'lodash';

import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getDateByOffset } from '@/utils/DateUtils';
import { WorkbookUtils } from '@/utils/WorkbookUtils';

test.describe('Export items template on inbound add items page', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let DOWNLOADED_FILE_PATH: string;
  let downloadedTemplateFile: WorkbookUtils;

  test.beforeEach(async ({ stockMovementService, supplierLocationService }) => {
    const supplierLocation = await supplierLocationService.getLocation();

    STOCK_MOVEMENT = await stockMovementService.createInbound({
      originId: supplierLocation.id,
    });
  });

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    downloadedTemplateFile.delete();
  });

  test('Export empty template', async ({ createInboundPage }) => {
    await test.step('Go to inbound list page', async () => {
      await createInboundPage.goToPage(STOCK_MOVEMENT.id);
      await createInboundPage.addItemsStep.isLoaded();
    });

    await test.step('Download template', async () => {
      const { fullFilePath } =
        await createInboundPage.addItemsStep.downloadTemplate();
      DOWNLOADED_FILE_PATH = fullFilePath;
    });

    await test.step('Read file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(DOWNLOADED_FILE_PATH);
    });

    expect(downloadedTemplateFile.sheetToJSON()).toHaveLength(0);

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

  test('Downloaded template should contain all added items', async ({
    createInboundPage,
    mainProductService,
    otherProductService,
    mainUserService,
  }) => {
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
      DOWNLOADED_FILE_PATH = fullFilePath;
    });

    await test.step('Read downloaded template file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(DOWNLOADED_FILE_PATH);
    });

    let parsedDocumentData: unknown[];
    await test.step('Parse csv document to json', async () => {
      parsedDocumentData = downloadedTemplateFile.sheetToJSON();
    });

    await test.step('Assert exported item count in the template', async () => {
      expect(parsedDocumentData).toHaveLength(2);
    });

    for (let i = 0; i < ROWS.length; i++) {
      await test.step(`Assert data of exported template on row: ${i}`, async () => {
        const documentRow = parsedDocumentData[i];
        const row = ROWS[i];

        expect(_.get(documentRow, 'Requisition item id')).toBeTruthy();
        expect(
          _.toString(_.get(documentRow, 'Product code (required)'))
        ).toEqual(row.productCode);
        expect(_.get(documentRow, 'Product name')).toEqual(row.productName);
        expect(_.get(documentRow, 'Pack level 1')).toEqual(row.packLevel1);
        expect(_.get(documentRow, 'Pack level 2')).toEqual(row.packLevel2);
        expect(_.get(documentRow, 'Lot number')).toEqual(row.lotNumber);
        expect(_.toString(_.get(documentRow, 'Quantity (required)'))).toEqual(
          row.quantity
        );
        expect(_.get(documentRow, 'Recipient id')).toBeTruthy();
      });
    }
  });
});
