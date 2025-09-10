import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getToday } from '@/utils/DateUtils';
import { WorkbookUtils } from '@/utils/WorkbookUtils';

test.describe('Export stock movements', () => {
  let INBOUND1: StockMovementResponse;
  let INBOUND2: StockMovementResponse;
  const workbooks: WorkbookUtils[] = [];
  const TODAY = getToday();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      productService.setProduct('1');
      const PRODUCT_ONE = await productService.getProduct();
      productService.setProduct('2');
      const PRODUCT_TWO = await productService.getProduct();

      INBOUND1 = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(INBOUND1.id, [
        {
          productId: PRODUCT_ONE.id,
          quantity: 50,
        },
        { productId: PRODUCT_TWO.id, quantity: 100 },
      ]);

      await stockMovementService.sendInboundStockMovement(INBOUND1.id, {
        shipmentType: ShipmentType.AIR,
      });

      INBOUND2 = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(INBOUND2.id, [
        {
          productId: PRODUCT_ONE.id,
          quantity: 50,
        },
      ]);
    }
  );

  test.afterEach(async ({ stockMovementService, stockMovementShowPage }) => {
    await stockMovementShowPage.goToPage(INBOUND1.id);
    await stockMovementShowPage.isLoaded();
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(INBOUND1.id);
    await stockMovementShowPage.goToPage(INBOUND2.id);
    await stockMovementShowPage.isLoaded();
    await stockMovementService.deleteStockMovement(INBOUND2.id);

    for (const workbook of workbooks) {
      workbook.delete();
    }
  });

  test('Export Stock Movements', async ({ inboundListPage }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    let filePath: string;
    let exportStockMovements: WorkbookUtils;

    const ROWS = [
      {
        status: 'CHECKING',
        receiptStatus: 'PENDING',
        identifier: INBOUND2.identifier,
        name: INBOUND2.description,
        origin: INBOUND2.origin.name,
        destination: INBOUND2.destination.name,
        stocklist: undefined,
        requestedBy: INBOUND2.requestedBy.name,
        dateRequested: INBOUND2.dateRequested.replace(/\//g, '-'),
        dateCreated: INBOUND2.dateCreated.replace(/\//g, '-'),
        dateShipped: formatDate(TODAY, 'MM-DD-YYYY'),
      },
      {
        status: 'ISSUED',
        receiptStatus: 'SHIPPED',
        identifier: INBOUND1.identifier,
        name: INBOUND1.description,
        origin: INBOUND1.origin.name,
        destination: INBOUND1.destination.name,
        stocklist: undefined,
        requestedBy: INBOUND1.requestedBy.name,
        dateRequested: INBOUND1.dateRequested.replace(/\//g, '-'),
        dateCreated: INBOUND1.dateCreated.replace(/\//g, '-'),
        dateShipped: formatDate(TODAY, 'MM-DD-YYYY'),
      },
    ];

    await test.step('Download file', async () => {
      const { fullFilePath } = await inboundListPage.exportStockMovements();
      filePath = fullFilePath;
    });

    let parsedDocumentData: unknown[][];

    await test.step('Read file', async () => {
      exportStockMovements = WorkbookUtils.read(filePath);
      workbooks.push(exportStockMovements);
      parsedDocumentData = exportStockMovements.getData();
    });

    await test.step('Assert template columns', async () => {
      expect(exportStockMovements.getHeaders()).toStrictEqual([
        'Status',
        'Receipt Status',
        'Identifier',
        'Name',
        'Origin',
        'Destination',
        'Stocklist',
        'Requested by',
        'Date Requested',
        'Date Created',
        'Date Shipped',
      ]);
    });

    for (let i = 0; i < ROWS.length; i++) {
      await test.step(`Assert data of exported template on row: ${i}`, async () => {
        const documentRow = parsedDocumentData[i];
        const row = ROWS[i];

        expect(documentRow[0]).toEqual(row.status);
        expect(documentRow[1]).toEqual(row.receiptStatus);
        expect(documentRow[2]).toEqual(row.identifier);
        expect(documentRow[3]).toEqual(row.name);
        expect(documentRow[4]).toEqual(row.origin);
        expect(documentRow[5]).toEqual(row.destination);
        expect(documentRow[6]).toEqual(row.stocklist);
        expect(documentRow[7]).toEqual(row.requestedBy);
        expect(documentRow[8]).toEqual(row.dateRequested);
        expect(documentRow[9]).toEqual(row.dateCreated);
        expect(documentRow[10]).toEqual(row.dateShipped);
      });
    }

    await test.step('Use search bar and apply filtering', async () => {
      await inboundListPage.filters.searchField.textbox.fill(
        INBOUND2.identifier
      );
      await inboundListPage.search();
    });

    await test.step('Download filtered file', async () => {
      const { fullFilePath } = await inboundListPage.exportStockMovements();
      filePath = fullFilePath;
    });

    await test.step('Read file', async () => {
      exportStockMovements = WorkbookUtils.read(filePath);
      workbooks.push(exportStockMovements);
      parsedDocumentData = exportStockMovements.getData();
      expect(parsedDocumentData).toHaveLength(1);
    });

    await test.step('Assert filtered file', async () => {
      const documentRow = parsedDocumentData[0];
      expect(documentRow[2]).toEqual(ROWS[0].identifier);
    });
  });
});
