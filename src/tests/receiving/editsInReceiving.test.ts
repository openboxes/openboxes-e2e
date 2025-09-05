import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDateByOffset, getToday } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Edit items in the middle of receipt', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();
  const uniqueIdentifier = new UniqueIdentifier();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await productService.getProduct();
      productService.setProduct('2');
      const PRODUCT_TWO = await productService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        description,
        dateRequested,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_ONE.id,
            quantity: 20,
            lotNumber: uniqueIdentifier.generateUniqueString('lot'),
            expirationDate: getDateByOffset(new Date(), 3),
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

  test('Edit item qty on receiving page', async ({
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

    await test.step('Open edit modal for 1st item and edit qty to higher value', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('50');
      await receivingPage.receivingStep.editModal.informationAboutEditedQtyNotMatchingShippedQty.isVisible();
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal for 2nd item and edit qty to lower value', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('2');
      await receivingPage.receivingStep.editModal.informationAboutEditedQtyNotMatchingShippedQty.isVisible();
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert shipped qty after edits for both items', async () => {
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Shipped')
      ).toContainText('50');
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Shipped')
      ).toContainText('2');
    });

    await test.step('Autofill receiving qty for both items', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
    });

    await test.step('Go to check page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });

  test('Assert validation on using exp date without lot for item with lot', async ({
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

    await test.step('Open edit modal for 1st item and clear lot field', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.textbox.clear();
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.assertHasError();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.textbox.hover();
      await expect(
        receivingPage.receivingStep.editModal.table.row(0).lotNumberField
          .tooltip
      ).toContainText('Items with an expiry date must also have a lot number.');
    });
  });

  test('Assert validation on using exp date without lot for item without lot', async ({
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

    await test.step('Open edit modal for 2nd item and add exp date without lot', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .expiryDatePickerField.fill(getDateByOffset(new Date(), 5));
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.assertHasError();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.textbox.hover();
      await expect(
        receivingPage.receivingStep.editModal.table.row(0).lotNumberField
          .tooltip
      ).toContainText('Items with an expiry date must also have a lot number.');
    });
  });

  test('Assert validation on using exp date without lot for item with lot on splitted line', async ({
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

    await test.step('Open edit modal for 1st item and clear lot field', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .quantityShippedField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .expiryDatePickerField.fill(getDateByOffset(new Date(), 5));
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .lotNumberField.assertHasError();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .lotNumberField.textbox.hover();
      await expect(
        receivingPage.receivingStep.editModal.table.row(1).lotNumberField
          .tooltip
      ).toContainText('Items with an expiry date must also have a lot number.');
    });
  });

  test('Add lot and exp date for item in the middle of receipt', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    const lot = 'add-lot-test';
    const expDate = getDateByOffset(new Date(), 5);

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal for item without lot and add lot and exp date', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .expiryDatePickerField.fill(expDate);
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert added lot and exp date on receive page', async () => {
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Lot/Serial No.')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Expiration date')
      ).toContainText(formatDate(expDate, 'MM/DD/YYYY'));
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });

  test('Split line into 2 lots', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    const lot = 'add-lot-test';
    const expDate = getDateByOffset(new Date(), 5);

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal for item with lot and split into 2 lots', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('15');
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .expiryDatePickerField.fill(expDate);
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .quantityShippedField.numberbox.fill('5');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert added lot and exp date and shipped qty on receive page', async () => {
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Lot/Serial No.')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Expiration date')
      ).toContainText(formatDate(expDate, 'MM/DD/YYYY'));
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Shipped')
      ).toContainText('15');
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Shipped')
      ).toContainText('5');
    });

    await test.step('Select splitted item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('15');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('5');
    });

    await test.step('Go to check page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });
});
