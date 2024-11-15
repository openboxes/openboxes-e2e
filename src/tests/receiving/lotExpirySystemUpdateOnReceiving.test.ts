import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

const uniqueIdentifier = new UniqueIdentifier();

test.describe('Lot number system expiry date modification on receving workflow', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(async ({ supplierLocationService, stockMovementService }) => {
    const supplierLocation = await supplierLocationService.getLocation();

    await test.step('Create inbound stock movement', async () => {
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });
    });
  });

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await test.step('Go to stock movmentm show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    const isButtonVisible =
      await stockMovementShowPage.rollbackLastReceiptButton.isVisible();
    // due to failed test, shipment might not be received which will not show the button
    if (isButtonVisible) {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    }

    await test.step('Rollback shipment', async () => {
      await stockMovementShowPage.rollbackButton.click();
    });

    await test.step('Delete shipment', async () => {
      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    });
  });

  test('Edit lot expiration date on a new lot does not render a confirmation modal', async ({
    stockMovementShowPage,
    receivingPage,
    stockMovementService,
    mainProductService,
    productShowPage,
  }) => {
    const TES_LOT = {
      lotNumber: uniqueIdentifier.generateUniqueString('lot'),
      expirationDate: getDateByOffset(getToday(), 4),
    };

    const product = await mainProductService.getProduct();

    await test.step('Ensure that lot number does not exist in product stock', async () => {
      await productShowPage.goToPage(product.id);
      await productShowPage.recordStockButton.click();
      await expect(
        productShowPage.recordStock.lineItemsTable.table
      ).not.toContainText(TES_LOT.lotNumber);
    });

    await test.step('Add item to stock movement', async () => {
      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: product.id,
            quantity: 10,
            lotNumber: TES_LOT.lotNumber,
            expirationDate: TES_LOT.expirationDate,
          },
        ]
      );
    });

    await test.step('Send stock movement', async () => {
      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    });

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Start receiving process', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal of receving item', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeVisible();
    });

    await test.step('Update expiration date of selected item lot', async () => {
      const updatedExpiryDate = getDateByOffset(getToday(), 2);
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .expiryDatePickerField.fill(updatedExpiryDate);

      await receivingPage.receivingStep.editModal.saveButton.click();
    });

    await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();

    await test.step('Autofill all quantities of receving items', async () => {
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
    });

    await test.step('Go to next step', async () => {
      await receivingPage.nextButton.click();
    });

    // TODO warning modal should not appear

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Ensure that lot number exist in product stock', async () => {
      await productShowPage.goToPage(product.id);
      await productShowPage.recordStockButton.click();
      await expect(
        productShowPage.recordStock.lineItemsTable.table
      ).toContainText(TES_LOT.lotNumber);
    });
  });
});
