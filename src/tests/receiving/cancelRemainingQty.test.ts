import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Cancel qty in the middle of receipt', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

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

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_ONE.id,
            quantity: 100,
          },
          { productId: PRODUCT_TWO.id, quantity: 10 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
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

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Cancel remaining qty when receive item partially', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input receiving qty for both items', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('50');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and assert qty remaining', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toHaveText('50');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Remaining')
      ).toHaveText('0');
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeEnabled();
      await expect(
        receivingPage.checkStep.table.row(2).cancelRemainingCheckbox
      ).toBeDisabled();
    });

    await test.step('Select cancel remaining qty checkbox and receive shipment', async () => {
      await receivingPage.checkStep.table
        .row(1)
        .cancelRemainingCheckbox.check();
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeChecked();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert canceled qty on stock movement show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await stockMovementShowPage.receiptTab.click();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityCanceled
      ).toHaveText('50');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('50');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('10');
    });
  });

  test('Cancel remaining qty when receive items in 2nd receipt', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input receiving qty for 1 item', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('50');
    });

    await test.step('Go to check page and finish 1st receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toHaveText('50');
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeEnabled();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert canceled qty on stock movement show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Receiving');
      await stockMovementShowPage.receiptTab.click();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('50');
    });

    await test.step('Start 2nd receipt', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input receiving qty for both items', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('25');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('0');
    });

    await test.step('Go to check page and assert qty remaining', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toHaveText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Remaining')
      ).toHaveText('25');
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeEnabled();
      await expect(
        receivingPage.checkStep.table.row(2).cancelRemainingCheckbox
      ).toBeEnabled();
    });

    await test.step('Select cancel remaining qty checkbox and receive shipment', async () => {
      await receivingPage.checkStep.table
        .row(1)
        .cancelRemainingCheckbox.check();
      await receivingPage.checkStep.table
        .row(2)
        .cancelRemainingCheckbox.check();
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeChecked();
      await expect(
        receivingPage.checkStep.table.row(2).cancelRemainingCheckbox
      ).toBeChecked();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert canceled qty on stock movement show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await stockMovementShowPage.receiptTab.click();
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('10');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(3).quantityCanceled
      ).toHaveText('25');
      await expect(
        stockMovementShowPage.receiptListTable.row(3).quantityReceived
      ).toHaveText('25');
    });

    await test.step('Rollback shipment received in 2 receipts', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });
  });

  test('Assert remaining qty and disabled cancel remaining checkbox when receive qty bigger than shipped', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input receiving qty for both items', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('200');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('100');
    });

    await test.step('Go to check page and assert qty remaining', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toHaveText('-100');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Remaining')
      ).toHaveText('-90');
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeDisabled();
      await expect(
        receivingPage.checkStep.table.row(2).cancelRemainingCheckbox
      ).toBeDisabled();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert canceled and received qty on stock movement show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await stockMovementShowPage.receiptTab.click();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityCanceled
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('200');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('0');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('100');
    });
  });

  test('Cancel remaining qty using cancel all remaining button', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input partial qty for both items', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('50');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('5');
    });

    await test.step('Go to check page and assert qty remaining', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toHaveText('50');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Remaining')
      ).toHaveText('5');
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeEnabled();
      await expect(
        receivingPage.checkStep.table.row(2).cancelRemainingCheckbox
      ).toBeEnabled();
    });

    await test.step('Select cancel all remaining button', async () => {
      await receivingPage.checkStep.cancelAllRemainingButton.click();
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeChecked();
      await expect(
        receivingPage.checkStep.table.row(2).cancelRemainingCheckbox
      ).toBeChecked();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert canceled qty on stock movement show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await stockMovementShowPage.receiptTab.click();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityCanceled
      ).toHaveText('50');
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('50');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityCanceled
      ).toHaveText('5');
      await expect(
        stockMovementShowPage.receiptListTable.row(2).quantityReceived
      ).toHaveText('5');
    });
  });

  test('Assert cancel checkbox selection when going forward and backward', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input receiving qty for 1 item', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('50');
    });

    await test.step('Go to check page', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.table
        .row(1)
        .cancelRemainingCheckbox.click();
    });

    await test.step('Go to backward to receiving page and forward again', async () => {
      await receivingPage.checkStep.backToEditButton.click();
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).not.toBeChecked();
      await receivingPage.checkStep.table
        .row(1)
        .cancelRemainingCheckbox.click();
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeChecked();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert canceled and received qty on stock movement show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Receiving');
      await stockMovementShowPage.packingListTab.click();
      await expect(
        stockMovementShowPage.packingListTable.row(1).quantityShipped
      ).toHaveText('100');
      await expect(
        stockMovementShowPage.packingListTable.row(1).quantityReceived
      ).toHaveText('50');
      await expect(
        stockMovementShowPage.packingListTable.row(1).quantityCanceled
      ).toHaveText('50');
    });

    await test.step('Start 2nd receipt', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input receiving qty for 2nd item', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('2');
    });

    await test.step('Go to check page and cancel qty remaining', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.table
        .row(1)
        .cancelRemainingCheckbox.click();
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).toBeChecked();
    });

    await test.step('Go to backward to receiving page and forward again', async () => {
      await receivingPage.checkStep.backToEditButton.click();
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.row(1).cancelRemainingCheckbox
      ).not.toBeChecked();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert canceled and received qty on stock movement show page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Receiving');
      await stockMovementShowPage.packingListTab.click();
      await expect(
        stockMovementShowPage.packingListTable.row(2).quantityShipped
      ).toHaveText('10');
      await expect(
        stockMovementShowPage.packingListTable.row(2).quantityReceived
      ).toHaveText('2');
      await expect(
        stockMovementShowPage.packingListTable.row(2).quantityCanceled
      ).toHaveText('0');
    });

    await test.step('Rollback shipment received in 2 receipts', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });
  });
});
