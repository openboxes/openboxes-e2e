import { expect, test } from '@/fixtures/fixtures';
import { getDateByOffset, getToday } from '@/utils/DateUtils';
import { WorkbookUtils } from '@/utils/WorkbookUtils';

test.describe('Export all incoming items', () => {
  let INBOUND_ID: string;
  let INBOUND2_ID: string;
  const workbooks: WorkbookUtils[] = [];

  test.beforeEach(
    async ({
      supplierLocationService,
      createInboundPage,
      mainProductService,
      mainUserService,
      otherProductService,
      stockMovementShowPage,
      inboundListPage,
    }) => {
      const ORIGIN = await supplierLocationService.getLocation();
      const DESCRIPTION = 'some description';
      const USER = await mainUserService.getUser();
      const TODAY = getToday();

      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();
      const SHIPMENT_TYPE = 'Land';
      const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);

      const ROWS1 = [
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

      const ROWS2 = [
        {
          product: {
            productCode: PRODUCT_ONE.productCode,
            productName: PRODUCT_ONE.name,
          },
          quantity: '10',
        },
      ];

      await inboundListPage.goToPage();
      const ifInboundListPageIsEmpty =
        await inboundListPage.table.emptyInboundList.isVisible();

      if (ifInboundListPageIsEmpty) {
        await test.step('Create and ship stock movement when inbound list is empty', async () => {
          await createInboundPage.goToPage();
          await createInboundPage.createStep.originSelect.findAndSelectOption(
            ORIGIN.name
          );
          await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
            USER.name
          );
          await createInboundPage.createStep.dateRequestedDatePicker.fill(
            TODAY
          );
          await createInboundPage.createStep.descriptionField.textbox.fill(
            DESCRIPTION
          );
          await createInboundPage.nextButton.click();
          await createInboundPage.addItemsStep.isLoaded();
          await createInboundPage.wizzardSteps.assertActiveStep('Add items');

          INBOUND2_ID = createInboundPage.getId();

          await createInboundPage.addItemsStep.addItems(ROWS2);
          await createInboundPage.nextButton.click();
          await createInboundPage.sendStep.isLoaded();

          await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
            SHIPMENT_TYPE
          );
          await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
            EXPECTED_DELIVERY_DATE
          );
          await createInboundPage.sendStep.sendShipmentButton.click();
          await stockMovementShowPage.waitForUrl();
          await stockMovementShowPage.isLoaded();
        });
      }

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

      await createInboundPage.addItemsStep.addItems(ROWS1);

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
    }
  );

  test.afterEach(
    async ({ stockMovementService, stockMovementShowPage, page }) => {
      await stockMovementShowPage.goToPage(INBOUND_ID);
      await stockMovementShowPage.isLoaded();
      const isRollbackLastReceiptButtonVisible =
        await stockMovementShowPage.rollbackLastReceiptButton.isVisible();
      const isRollbackButtonVisible =
        await stockMovementShowPage.rollbackButton.isVisible();

      // due to failed test, shipment might not be received which will not show the button
      if (isRollbackLastReceiptButtonVisible) {
        await stockMovementShowPage.rollbackLastReceiptButton.click();
      }

      if (isRollbackButtonVisible) {
        await stockMovementShowPage.rollbackButton.click();
      }

      await stockMovementService.deleteStockMovement(INBOUND_ID);

      for (const workbook of workbooks) {
        workbook.delete();
      }

      if (INBOUND2_ID) {
        await stockMovementShowPage.goToPage(INBOUND2_ID);
        await stockMovementShowPage.isLoaded();
        await stockMovementShowPage.rollbackButton.click();
        await stockMovementService.deleteStockMovement(INBOUND2_ID);
      }
    }
  );

  test('Export all incoming items should include shipped items', async ({
    inboundListPage,
    stockMovementService,
  }) => {
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

    await test.step('Assert that both items from stock movement are included in the export file', async () => {
      const { data } = await stockMovementService.getStockMovement(INBOUND_ID);
      const fileData = downloadedTemplateFile.getData();

      const stockMovementItemsFromFile = fileData.filter(
        (it) => it[5] === data.identifier
      );
      expect(stockMovementItemsFromFile).toHaveLength(2);
    });
  });

  test('Export all incoming items should include shipped items not received items', async ({
    inboundListPage,
    stockMovementShowPage,
    stockMovementService,
    receivingPage,
  }) => {
    let filePath: string;
    let downloadedTemplateFile: WorkbookUtils;

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

    await test.step('Receive shipment partially', async () => {
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

    await test.step('Assert 1 item from stock movement is included in the export file', async () => {
      const { data } = await stockMovementService.getStockMovement(INBOUND_ID);
      const fileData = downloadedTemplateFile.getData();

      const stockMovementItemsFromFile = fileData.filter(
        (it) => it[5] === data.identifier
      );
      expect(stockMovementItemsFromFile).toHaveLength(1);
    });
  });

  // TODO: Adjust to rely on the empty database (on empty db it fails, because there is 404 No shipment items found)
  test('Export all incoming items should not include received items', async ({
    inboundListPage,
    stockMovementShowPage,
    stockMovementService,
    receivingPage,
  }) => {
    let filePath: string;
    let downloadedTemplateFile: WorkbookUtils;

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

    await test.step('Assert received items from stock movement are not included in the export file', async () => {
      const { data } = await stockMovementService.getStockMovement(INBOUND_ID);
      const fileData = downloadedTemplateFile.getData();

      const stockMovementItemsFromFile = fileData.filter(
        (it) => it[5] === data.identifier
      );
      expect(stockMovementItemsFromFile).toHaveLength(0);
    });
  });
});
