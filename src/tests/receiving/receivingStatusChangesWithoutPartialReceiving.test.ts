import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import InboundListPage from '@/pages/inbound/list/InboundListPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
import { StockMovementResponse } from '@/types';
import { getToday } from '@/utils/DateUtils';

test.describe('Status changes on sm view page when receive shipment in location without partial receiving', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
      depotLocationService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const depotLocation = await depotLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        destinationId: depotLocation.id,
        description,
        dateRequested,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: PRODUCT_ONE.id, quantity: 20 },
          { productId: PRODUCT_TWO.id, quantity: 10 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, authService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
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

    await stockMovementShowPage.clickDeleteShipment();
    await authService.changeLocation(AppConfig.instance.locations.main.id);
  });

  test('Assert status changes on view page and receipt tab when receive 1 item partially', async ({
    stockMovementShowPage,
    receivingPage,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert stock movement shipped status on show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to next page and accept Confirm receiving dialog', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.receivingStep.acceptConfirmReceivingDialog.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on sm show page after receiving item partially and cancel not received qty', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });

    await test.step('Assert Qty and statuses on receipt tab after receiving item partially and cancel not received qty', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityCanceled
      ).toHaveText('10');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('10');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('10');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('0');
    });
  });

  test('Assert status changes on view page and receipt tab when receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert stock movement shipped status on show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
    });

    await test.step('Go to next page and accept Confirm receiving dialog', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.receivingStep.acceptConfirmReceivingDialog.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on sm show page after receiving item partially and cancel not received qty', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });

    await test.step('Assert Qty and statuses on receipt tab after receiving item partially and cancel not received qty', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityCanceled
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('20');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('10');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('0');
    });
  });

  test('Assert status changes on view page and receipt tab when receive 1 item fully and 1 partially', async ({
    stockMovementShowPage,
    receivingPage,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert stock movement shipped status on show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('5');
    });

    await test.step('Go to next page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on sm show page after receiving items and cancel not received qty', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });

    await test.step('Assert Qty and statuses on receipt tab after receiving items and cancel not received qty', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityCanceled
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('20');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('5');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('5');
    });
  });

  test('Assert status changes on view page and receipt tab after rollback last receipt', async ({
    stockMovementShowPage,
    receivingPage,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert stock movement shipped status on show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('5');
    });

    await test.step('Go to next page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on sm show page after receiving items and cancel not received qty', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
    });

    await test.step('Assert Qty and statuses on receipt tab after receiving items and cancel not received qty', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityCanceled
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('20');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('5');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('5');
    });

    await test.step('Rollback last receipt', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert stock movement shipped status on show page after rollback receipt', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab after rollback receipt', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });
  });

  test('Assert status changes on inbound list when receive 1 item partially', async ({
    stockMovementShowPage,
    receivingPage,
    browser,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Shipped status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await newStockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Shipped'
      );
      await newPage.close();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to next page and accept Confirm receiving dialog', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.receivingStep.acceptConfirmReceivingDialog.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await newStockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Received'
      );
      await newPage.close();
    });
  });

  test('Assert status changes on inbound list when receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
    browser,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
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
        .receivingNowField.textbox.fill('20');
    });

    await test.step('Go to next page and accept Confirm receiving dialog', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.receivingStep.acceptConfirmReceivingDialog.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await newStockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Received'
      );
      await newPage.close();
    });
  });

  test('Assert status changes on inbound list when receive1 1 item fully and 1 partially', async ({
    stockMovementShowPage,
    receivingPage,
    browser,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
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
        .receivingNowField.textbox.fill('20');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('5');
    });

    await test.step('Go to next page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await newStockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Received'
      );
      await newPage.close();
    });
  });
});
