import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Assert recipient field when receive', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      mainUserService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      productService.setProduct('4');
      const PRODUCT_FOUR = await productService.getProduct();
      productService.setProduct('5');
      const PRODUCT_FIVE = await productService.getProduct();
      const USER = await mainUserService.getUser();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_FOUR.id,
            quantity: 10,
            recipientId: USER.id,
          },
          {
            productId: PRODUCT_FIVE.id,
            quantity: 10,
          },
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

  test('Assert recipient field filled and disabled', async ({
    stockMovementShowPage,
    receivingPage,
    mainUserService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert recipient field disabled and filled', async () => {
      const USER = await mainUserService.getUser();
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Recipient')
      ).toBeEmpty();
      await receivingPage.receivingStep.table
        .row(1)
        .recipientField.isDisabled();
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Recipient')
      ).toHaveText(USER.name);
      await receivingPage.receivingStep.table.row(2).recipientField.click();
      await receivingPage.receivingStep.table
        .row(2)
        .recipientField.getByTestId('custom-select-dropdown-menu')
        .isHidden();
    });

    await test.step('Fill partial qty for items', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('5');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('5');
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Fill partial qty for items', async () => {
      const USER = await mainUserService.getUser();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Recipient')
      ).toBeEmpty();
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Recipient')
      ).toHaveText(USER.name);
    });

    await test.step('Go backward and assert recipient field', async () => {
      const USER = await mainUserService.getUser();
      await receivingPage.checkStep.backToEditButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Recipient')
      ).toBeEmpty();
      await receivingPage.receivingStep.table
        .row(1)
        .recipientField.isDisabled();
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Recipient')
      ).toHaveText(USER.name);
      await receivingPage.receivingStep.table.row(2).recipientField.click();
      await receivingPage.receivingStep.table
        .row(2)
        .recipientField.getByTestId('custom-select-dropdown-menu')
        .isHidden();
    });

    await test.step('Finish 1st receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Start 2nd receipt and assert recipient field', async () => {
      const USER = await mainUserService.getUser();
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Recipient')
      ).toBeEmpty();
      await receivingPage.receivingStep.table
        .row(1)
        .recipientField.isDisabled();
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Recipient')
      ).toHaveText(USER.name);
      await receivingPage.receivingStep.table.row(2).recipientField.click();
      await receivingPage.receivingStep.table
        .row(2)
        .recipientField.getByTestId('custom-select-dropdown-menu')
        .isHidden();
    });
  });
});
