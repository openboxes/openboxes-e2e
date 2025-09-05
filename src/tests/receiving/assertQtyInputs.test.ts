import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';

test.describe('Assert if quantity inputs remain when split lines', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

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
      productService.setProduct('3');
      const PRODUCT_THREE = await productService.getProduct();

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
          { productId: PRODUCT_THREE.id, quantity: 200 },
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

  test('Assert quantity input after split line', async ({
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

    await test.step('Autofill receiving quantity', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
    });

    await test.step('Open edit modal for item and split line', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('100');
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .expiryDatePickerField.fill(expDate);
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .quantityShippedField.numberbox.fill('50');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .quantityShippedField.numberbox.fill('50');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert quantity input before split line', async () => {
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.textbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.textbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Lot/Serial No.')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Expiration date')
      ).toContainText(formatDate(expDate, 'MM/DD/YYYY'));
    });

    await test.step('Autofill quantity after split line', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.textbox
      ).toHaveValue('50');
    });

    await test.step('Edit another line', async () => {
      await receivingPage.receivingStep.table.row(5).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .expiryDatePickerField.fill(expDate);
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.textbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Lot/Serial No.')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Expiration date')
      ).toContainText(formatDate(expDate, 'MM/DD/YYYY'));
    });
  });

  test('Assert quantity input after split line whe use save and exit', async ({
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

    await test.step('Autofill quantity for items', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('200');
      await receivingPage.receivingStep.table
        .row(3)
        .receivingNowField.textbox.fill('100');
      await receivingPage.receivingStep.saveAndExitButton.click();
    });

    await test.step('Return to receipt', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('200');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toHaveValue('100');
    });

    await test.step('Open edit modal for item without quantity input', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('25');
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .expiryDatePickerField.fill(expDate);
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .quantityShippedField.numberbox.fill('25');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert quantity input after split line', async () => {
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toHaveValue('200');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.textbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Lot/Serial No.')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Expiration date')
      ).toContainText(formatDate(expDate, 'MM/DD/YYYY'));
    });

    await test.step('Autofill quantity after split line', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('25');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('25');
    });
  });
});
