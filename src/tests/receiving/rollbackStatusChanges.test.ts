import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import InboundListPage from '@/pages/inbound/list/InboundListPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { getToday } from '@/utils/DateUtils';

test.describe('Status changes on sm view page when rollback receipts', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
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
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await BinLocationUtils.deactivateReceivingBin({
        mainLocationService,
        locationListPage,
        createLocationPage,
        page,
        receivingBin,
      });
    }
  );

  test('Assert status changes on view page and receipt tab when rollback partial receipt of 1 item', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive partially', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('15');
    });

    await test.step('Go to check page and finish receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert statuses on stock movmenent show page after receiving item partially', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Receiving');
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('15');
    });

    await test.step('Rollback last receipt', async () => {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert stock movement shipped status on show page after rollback last receipt', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab after rollback last receipt', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });
  });

  test('Assert status changes on view page and receipt tab when receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive fully', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
    });

    await test.step('Go to check page and finish receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert statuses on stock movmenent show page after receiving fully 1 of items', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Receiving');
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('20');
    });

    await test.step('Rollback last receipt', async () => {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert stock movement shipped status on show page after rollback last receipt', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab after rollback last receipt', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });
  });

  test('Assert status changes on view page and receipt tab when receive 1 item fully and 1 partially', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and finish 1st receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item fully in 2nd receipt', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and finish 2nd receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert statuses on stock movmenent show page after receiving items', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(3).receiptStatus
      ).toHaveText('Received');
      await expect(
        stockMovementShowPage.receiptListTable.row(3).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(3).quantityReceived
      ).toHaveText('10');
    });

    await test.step('Rollback 2nd receipt', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert statuses on stock movmenent show page after receiving items', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Receiving');
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).receiptStatus
      ).toHaveText('Received');
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
        stockMovementShowPage.receiptListTable.row(2).quantityPending
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('10');
    });

    await test.step('Rollback 1st receipt', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert stock movement shipped status on show page after rollback both receipts', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert empty receipt tab after rollback both receipts', async () => {
      await stockMovementShowPage.receiptTab.click();
      await stockMovementShowPage.receiptTab.isVisible();
      await expect(stockMovementShowPage.emptyReceiptTab).toBeVisible();
    });
  });

  test('Assert status changes on inbound list when rollback partial receipt of 1 item', async ({
    stockMovementShowPage,
    receivingPage,
    browser,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive partially', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('15');
    });

    await test.step('Go to check page and finish receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Receiving status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await newStockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Receiving'
      );
      await newPage.close();
    });

    await test.step('Rollback last receipt', async () => {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert Shipped status on inbound list page after rollback', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
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
  });

  test('Assert status changes on inbound list when receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
    browser,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item to receive fully', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
    });

    await test.step('Go to check page and finish receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Receiving status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await newStockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Receiving'
      );
      await newPage.close();
    });

    await test.step('Rollback last receipt', async () => {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert Shipped status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
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
  });

  test('Assert status changes on inbound list when receive 1 item fully and 1 partially', async ({
    stockMovementShowPage,
    receivingPage,
    browser,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and finish 1st receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select item fully in 2nd receipt', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and finish 2nd receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Received status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
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

    await test.step('Rollback 2nd receipt', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert Receiving status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await newStockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Receiving'
      );
      await newPage.close();
    });
    await test.step('Rollback 1st receipt', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });

    await test.step('Assert Shipped status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
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
  });
});
