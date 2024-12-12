import { expect, test } from '@/fixtures/fixtures';
import { getDateByOffset, getToday } from '@/utils/DateUtils';
import { WorkbookUtils } from '@/utils/WorkbookUtils';

test.describe('Export all incomming items', () => {
  let INBOUND_ID: string;
  const workbooks: WorkbookUtils[] = [];

  test.afterEach(async ({ stockMovementService, stockMovementShowPage }) => {
    await stockMovementShowPage.goToPage(INBOUND_ID);
    await stockMovementShowPage.isLoaded();
    await stockMovementShowPage.rollbackLastReceiptButton.click();
    await stockMovementShowPage.rollbackLastReceiptButton.click();
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(INBOUND_ID);

    for (const workbook of workbooks) {
      workbook.delete();
    }
  });

  test('Export all incomming items should include items shipped not received', async ({
    otherProductService,
    mainProductService,
    mainUserService,
    inboundListPage,
    supplierLocationService,
    createInboundPage,
    stockMovementShowPage,
    stockMovementService,
    receivingPage,
  }) => {
    const ORIGIN = await supplierLocationService.getLocation();
    const DESCRIPTION = 'some description';
    const USER = await mainUserService.getUser();
    const TODAY = getToday();

    const PRODUCT_ONE = await mainProductService.getProduct();
    const PRODUCT_TWO = await otherProductService.getProduct();
    const SHIPMENT_TYPE = 'Land';
    const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);

    const ROWS = [
      {
        product: {
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
        },
        quantity: '12',
      },
      {
        product: {
          productCode: PRODUCT_TWO.productCode,
          productName: PRODUCT_TWO.name,
        },
        quantity: '12',
      },
    ];

    await test.step('Go to create stock movement', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.createStep.isLoaded();
    });

    await test.step('Create Stock Movement step', async () => {
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        USER.name
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
      await createInboundPage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
    });

    await test.step('Go next step (Add items)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    INBOUND_ID = createInboundPage.getId();

    await createInboundPage.addItemsStep.addItems(ROWS);

    await test.step('Go to next step (Send)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Fill shipment fields (Send)', async () => {
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
    });

    await test.step('Send shipment', async () => {
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    let filePath: string;
    let downloadedTemplateFile: WorkbookUtils;

    await test.step('Download file', async () => {
      const { fullFilePath } = await inboundListPage.downloadAllIncomingItems();
      filePath = fullFilePath;
    });

    await test.step('Read file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedTemplateFile);
    });

    await test.step('Assert that both items from stock movement are included in the epxort file', async () => {
      const { data } = await stockMovementService.getStockMovement(INBOUND_ID);
      const fileData = downloadedTemplateFile.getData();

      const stockMovementItemsFromFile = fileData.filter(
        (it) => it[5] === data.identifier
      );
      expect(stockMovementItemsFromFile).toHaveLength(2);
    });

    await test.step('Go to inbound view page', async () => {
      await stockMovementShowPage.goToPage(INBOUND_ID);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('12');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Download file', async () => {
      const { fullFilePath } = await inboundListPage.downloadAllIncomingItems();
      filePath = fullFilePath;
    });

    await test.step('Read file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedTemplateFile);
    });

    await test.step('Assert 1 item from stock movement is included in the epxort file', async () => {
      const { data } = await stockMovementService.getStockMovement(INBOUND_ID);
      const fileData = downloadedTemplateFile.getData();

      const stockMovementItemsFromFile = fileData.filter(
        (it) => it[5] === data.identifier
      );
      expect(stockMovementItemsFromFile).toHaveLength(1);
    });

    await test.step('Go to inbound view page', async () => {
      await stockMovementShowPage.goToPage(INBOUND_ID);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('12');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Download file', async () => {
      const { fullFilePath } = await inboundListPage.downloadAllIncomingItems();
      filePath = fullFilePath;
    });

    await test.step('Read file', async () => {
      downloadedTemplateFile = WorkbookUtils.read(filePath);
      workbooks.push(downloadedTemplateFile);
    });

    await test.step('Assert received items from stock movement are not included in the epxort file', async () => {
      const { data } = await stockMovementService.getStockMovement(INBOUND_ID);
      const fileData = downloadedTemplateFile.getData();

      const stockMovementItemsFromFile = fileData.filter(
        (it) => it[5] === data.identifier
      );
      expect(stockMovementItemsFromFile).toHaveLength(0);
    });
  });
});
