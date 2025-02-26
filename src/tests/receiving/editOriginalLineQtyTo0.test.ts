import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getDateByOffset } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Edit qty of original line to 0', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const lot = uniqueIdentifier.generateUniqueString('lot');

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
      thirdProductService,
      fourthProductService,
      fifthProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();
      const PRODUCT_THREE = await thirdProductService.getProduct();
      const PRODUCT_FOUR = await fourthProductService.getProduct();
      const PRODUCT_FIVE = await fifthProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_ONE.id,
            quantity: 50,
          },
          { productId: PRODUCT_TWO.id, quantity: 100 },
          {
            productId: PRODUCT_THREE.id,
            quantity: 200,
            lotNumber: lot,
            expirationDate: getDateByOffset(new Date(), 3),
          },
          { productId: PRODUCT_THREE.id, quantity: 50 },
          { productId: PRODUCT_FOUR.id, quantity: 200 },
          { productId: PRODUCT_FIVE.id, quantity: 100 },
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

  test('Edit qty of original line to 0', async ({
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

    await test.step('Open edit modal for item with lot', async () => {
      await receivingPage.receivingStep.table.row(5).checkbox.check();
      await receivingPage.receivingStep.table.row(5).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('0');
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .quantityShippedField.numberbox.fill('200');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert line with qty 0 is disabled', async () => {
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Shipped')
      ).toContainText('0');
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Received')
      ).toContainText('0');
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'To receive')
      ).toContainText('0');
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.textbox
      ).toBeDisabled();
      await expect(
        receivingPage.receivingStep.table.getCellValue(6, 'To receive')
      ).toContainText('200');
      await expect(receivingPage.receivingStep.table.rows).toHaveCount(8);
    });

    await test.step('Select items to receive using checkboxes', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table.row(4).checkbox.check();
      await receivingPage.receivingStep.table.row(6).checkbox.check();
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(6).receivingNowField.textbox
      ).toHaveValue('200');
    });

    await test.step('Assert lot and exp date on rows', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Lot/Serial No.')
      ).toBeEmpty();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Expiration date')
      ).toBeEmpty();
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Lot/Serial No.')
      ).toBeEmpty();
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Expiration date')
      ).toBeEmpty();
    });

    await test.step('Return to receiving step and assert orininal line is not visible', async () => {
      await receivingPage.checkStep.backToEditButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(receivingPage.receivingStep.table.rows).toHaveCount(7);
      await expect(
        receivingPage.receivingStep.table.row(5).checkbox
      ).toBeChecked();
      await expect(
        receivingPage.receivingStep.table.row(6).checkbox
      ).toBeChecked();
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(6).receivingNowField.textbox
      ).toHaveValue('200');
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Lot/Serial No.')
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Expiration date')
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.getCellValue(6, 'Lot/Serial No.')
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.getCellValue(6, 'Expiration date')
      ).toBeEmpty();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert received lines on Receipt tab', async () => {
      await stockMovementShowPage.receiptTab.click();
      await expect(stockMovementShowPage.receiptListTable.rows).toHaveCount(3);
      await expect(
        stockMovementShowPage.receiptListTable.row(1).serialLotNumber
      ).not.toHaveText(lot);
      await expect(
        stockMovementShowPage.receiptListTable.row(2).serialLotNumber
      ).not.toHaveText(lot);
    });
  });
});

test.describe('Edit original line to other product in the middle of receipt', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      fourthProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_FOUR = await fourthProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: PRODUCT_FOUR.id, quantity: 10 }]
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

  test('Edit qty of original line to 0 and edit product to other', async ({
    stockMovementShowPage,
    receivingPage,
    fifthProductService,
    fourthProductService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal for item', async () => {
      const PRODUCT_FIVE = await fifthProductService.getProduct();
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('0');
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .clearProductSelect.click();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .quantityShippedField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .getProductSelect(PRODUCT_FIVE.name);
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert line with qty 0 is disabled', async () => {
      const PRODUCT_FOUR = await fourthProductService.getProduct();
      const PRODUCT_FIVE = await fifthProductService.getProduct();
      await expect(
        receivingPage.receivingStep.table.row(1).checkbox
      ).toBeDisabled();
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Product')
      ).toHaveText(PRODUCT_FOUR.name);
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Shipped')
      ).toContainText('0');
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Received')
      ).toContainText('0');
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'To receive')
      ).toContainText('0');
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toBeDisabled();
      await expect(
        receivingPage.receivingStep.table.row(1).commentField.textbox
      ).toBeDisabled();
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Product')
      ).toHaveText(PRODUCT_FIVE.name);
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'To receive')
      ).toContainText('10');
      await expect(receivingPage.receivingStep.table.rows).toHaveCount(3);
    });

    await test.step('Select item to receive using checkboxes', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table.row(2).checkbox.check();
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('10');
    });

    await test.step('Assert product name on check step', async () => {
      const PRODUCT_FIVE = await fifthProductService.getProduct();
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Product')
      ).toHaveText(PRODUCT_FIVE.name);
      await expect(receivingPage.receivingStep.table.rows).toHaveCount(2);
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert received product on stock movement show page', async () => {
      const PRODUCT_FOUR = await fourthProductService.getProduct();
      const PRODUCT_FIVE = await fifthProductService.getProduct();
      await stockMovementShowPage.packingListTab.isVisible();
      await expect(
        stockMovementShowPage.packingListTable.row(1).product
      ).toHaveText(PRODUCT_FOUR.name);
      await stockMovementShowPage.receiptTab.click();
      await expect(
        stockMovementShowPage.receiptListTable.row(1).product
      ).toHaveText(PRODUCT_FIVE.name);
      await expect(
        stockMovementShowPage.receiptListTable.row(1).quantityReceived
      ).toHaveText('10');
    });
  });
});
