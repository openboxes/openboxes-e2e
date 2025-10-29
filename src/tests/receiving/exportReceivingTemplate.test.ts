import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';
import { WorkbookUtils } from '@/utils/WorkbookUtils';

test.describe('Export receiving template', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const workbooks: WorkbookUtils[] = [];
  const lot = uniqueIdentifier.generateUniqueString('lot');

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
      thirdProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();
      const PRODUCT_THREE = await thirdProductService.getProduct();

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
          { productId: PRODUCT_TWO.id, quantity: 12 },
          { productId: PRODUCT_THREE.id, quantity: 50 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(
    async ({
      stockMovementShowPage,
      stockMovementService,
      mainLocationService,
      page,
      locationListPage,
      createLocationPage,
    }) => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.rollbackLastReceiptButton.click();
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

      for (const workbook of workbooks) {
        workbook.delete();
      }

      await test.step('Deactivate receiving bin', async () => {
        const mainLocation = await mainLocationService.getLocation();
        const receivingBin =
          AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
        await page.goto('./location/list');
        await locationListPage.searchByLocationNameField.fill(
          mainLocation.name
        );
        await locationListPage.findButton.click();
        await locationListPage.getLocationEditButton(mainLocation.name).click();
        await createLocationPage.binLocationTab.click();
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.searchField.fill(
          receivingBin
        );
        await createLocationPage.binLocationTabSection.searchField.press(
          'Enter'
        );
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.editBinButton.click();
        await createLocationPage.locationConfigurationTab.click();
        await createLocationPage.locationConfigurationTabSection.activeCheckbox.uncheck();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });
    }
  );

  test('Export receiving template', async ({
    stockMovementShowPage,
    receivingPage,
    mainProductService,
    otherProductService,
    thirdProductService,
  }) => {
    let filePath: string;
    let downloadedExportTemplateFile: WorkbookUtils;

    const PRODUCT_ONE = await mainProductService.getProduct();
    const PRODUCT_TWO = await otherProductService.getProduct();
    const PRODUCT_THREE = await thirdProductService.getProduct();

    const ROWS = [
      {
        productCode: PRODUCT_ONE.productCode,
        productName: PRODUCT_ONE.name,
        lotNumber: lot,
        expirationDate: formatDate(getDateByOffset(new Date(), 3)),
        binLocation:
          AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier,
        quantityShipped: '20',
        quantityReceived: '20',
        quantityToReceive: '20',
      },
      {
        productCode: PRODUCT_THREE.productCode,
        productName: PRODUCT_THREE.name,
        binLocation:
          AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier,
        quantityShipped: '50',
        quantityReceived: '25',
        quantityToReceive: '50',
      },
      {
        productCode: PRODUCT_TWO.productCode,
        productName: PRODUCT_TWO.name,
        binLocation:
          AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier,
        quantityShipped: '12',
        quantityToReceive: '12',
        receivingNowQty: '12',
        comment: 'e2e_comment',
      },
    ];

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
      parsedDocumentData = downloadedExportTemplateFile.getData();
    });

    await test.step('Assert template columns', async () => {
      expect(downloadedExportTemplateFile.getHeaders()).toStrictEqual([
        'Receipt item id',
        'Shipment item id',
        'Code',
        'Name',
        'Lot/Serial No.',
        'Expiration date',
        'Bin Location',
        'Recipient',
        'Shipped (each)',
        'Received',
        'To receive',
        'Receiving now (each)',
        'Comment',
      ]);
    });

    await test.step('Assert exported item count in the template', async () => {
      expect(parsedDocumentData).toHaveLength(3);
    });

    for (let i = 0; i < ROWS.length; i++) {
      await test.step(`Assert data of exported template on row: ${i}`, async () => {
        const documentRow = parsedDocumentData[i];
        const row = ROWS[i];

        expect(_.toString(documentRow[2])).toEqual(row.productCode);
        expect(documentRow[3]).toEqual(row.productName);
        expect(documentRow[4]).toEqual(row.lotNumber);
        expect(documentRow[5]).toEqual(row.expirationDate);
        expect(documentRow[6]).toEqual(row.binLocation);
        expect(_.toString(documentRow[8])).toEqual(row.quantityShipped);
        expect(_.toString(documentRow[10])).toEqual(row.quantityToReceive);
      });
    }

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('25');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
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

    await test.step('Read downloaded file', async () => {
      downloadedExportTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedExportTemplateFile);
      parsedDocumentData = downloadedExportTemplateFile.getData();
    });

    await test.step('Assert data of exported template on 1st row', async () => {
      const documentRow = parsedDocumentData[0];
      expect(_.toString(documentRow[8])).toEqual(ROWS[0].quantityShipped);
      expect(_.toString(documentRow[9])).toEqual(ROWS[0].quantityReceived);
    });

    await test.step('Assert data of exported template on 2nd row:', async () => {
      const documentRow = parsedDocumentData[1];
      expect(_.toString(documentRow[8])).toEqual(ROWS[1].quantityShipped);
      expect(_.toString(documentRow[9])).toEqual(ROWS[1].quantityReceived);
      expect(_.toString(documentRow[10])).toEqual(ROWS[1].quantityReceived);
    });

    await test.step('Assert data of exported template on 3rd row:', async () => {
      const documentRow = parsedDocumentData[2];
      expect(_.toString(documentRow[8])).toEqual(ROWS[2].quantityShipped);
      expect(_.toString(documentRow[10])).toEqual(ROWS[2].quantityToReceive);
    });

    await test.step('Input qty to receive and comment', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(3)
        .receivingNowField.textbox.fill('12');
      await receivingPage.receivingStep.table
        .row(3)
        .commentField.textbox.fill('e2e_comment');
      await receivingPage.receivingStep.saveButton.click();
    });

    await test.step('Download export template after input data', async () => {
      const { fullFilePath } =
        await receivingPage.receivingStep.downloadExportTemplate();
      filePath = fullFilePath;
    });

    await test.step('Read downloaded file', async () => {
      downloadedExportTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedExportTemplateFile);
      parsedDocumentData = downloadedExportTemplateFile.getData();
    });

    await test.step('Assert saved input data in export template on row:', async () => {
      const documentRow = parsedDocumentData[2];
      expect(_.toString(documentRow[11])).toEqual(ROWS[2].receivingNowQty);
      expect(_.toString(documentRow[12])).toEqual(ROWS[2].comment);
    });
  });
});
