import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Use table shortcuts on receiving page', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const packLevel1 = 'pallete1';
  const packLevel2 = 'box1';
  const comment = 'e2e-comment';

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
      thirdProductService,
      fourthProductService,
      fifthProductService
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
            quantity: 10,
            packLevel1: packLevel1,
            packLevel2: packLevel2,
          },
          { productId: PRODUCT_TWO.id, 
            quantity: 10,
            packLevel1: packLevel1,
            packLevel2: packLevel2,
         },
         { productId: PRODUCT_THREE.id, 
            quantity: 10,
            packLevel1: packLevel1,
            packLevel2: packLevel2,
         },
         { productId: PRODUCT_FOUR.id, 
            quantity: 10,
         },
         { productId: PRODUCT_FIVE.id, 
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

  test('Use Ctrl+ArrowDown copy cell shortcut on receiving now and comment fields', async ({
    stockMovementShowPage,
    receivingPage,
    page,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Fill qty for 1st row and copy for other lines using Ctrl+ArrowDown', async () => {
      await receivingPage.receivingStep.table.row(1).receivingNowField.textbox.fill('10');
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('10');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('10');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toHaveValue('10');
    });

    await test.step('Fill comment for 1st row and copy for other lines using Ctrl+ArrowDown', async () => {
        await receivingPage.receivingStep.table.row(1).commentField.textbox.fill(comment);
        await page.keyboard.press('Control+ArrowDown');
        await page.keyboard.press('Control+ArrowDown');
        await expect(
          receivingPage.receivingStep.table.row(1).commentField.textbox
        ).toHaveValue(comment);
        await expect(
          receivingPage.receivingStep.table.row(2).commentField.textbox
        ).toHaveValue(comment);
        await expect(
          receivingPage.receivingStep.table.row(3).commentField.textbox
        ).toHaveValue(comment);
      });

    await test.step('Go to check page and assert data', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Receiving now')
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(3, 'Receiving now')
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Comment')
      ).toContainText(comment);
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Comment')
      ).toContainText(comment);
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Comment')
      ).toContainText(comment);
    });
  });

  test('Assert Ctrl+ArrowDown shortcut not working when item already received', async ({
    stockMovementShowPage,
    receivingPage,
    page,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Receive 1 product fully', async () => {
      await receivingPage.receivingStep.table.row(3).receivingNowField.textbox.fill('10');
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });


    await test.step('Try to use Ctrl+ArrowDown on receiving now on already revceived line', async () => {
       await stockMovementShowPage.receiveButton.click();
       await receivingPage.receivingStep.isLoaded();
       await receivingPage.receivingStep.table.row(1).receivingNowField.textbox.fill('10');
       await page.keyboard.press('Control+ArrowDown');
       await page.keyboard.press('Control+ArrowDown');
       await page.keyboard.press('Control+ArrowDown');
       await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('10');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toBeDisabled();
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.textbox
      ).not.toHaveValue('10');
    });

    await test.step('Try to use Ctrl+ArrowDown on comment on already revceived line', async () => {
        await receivingPage.receivingStep.table.row(1).commentField.textbox.fill(comment);
        await page.keyboard.press('Control+ArrowDown');
        await page.keyboard.press('Control+ArrowDown');
        await page.keyboard.press('Control+ArrowDown');
        await expect(
          receivingPage.receivingStep.table.row(2).commentField.textbox
        ).toHaveValue(comment);
        await expect(
          receivingPage.receivingStep.table.row(3).commentField.textbox
        ).toBeDisabled();
        await expect(
            receivingPage.receivingStep.table.row(4).commentField.textbox
          ).not.toHaveValue(comment);;
      });


    await test.step('Go to check page and assert data', async () => {
        await receivingPage.nextButton.click();
        await receivingPage.checkStep.isLoaded();
        await expect(
          receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
        ).toContainText('10');
        await expect(
          receivingPage.checkStep.table.getCellValue(2, 'Receiving now')
        ).toContainText('10');
        await expect(
          receivingPage.checkStep.table.getCellValue(3, 'Receiving now')
        ).toBeHidden();
        await expect(
          receivingPage.checkStep.table.getCellValue(1, 'Comment')
        ).toContainText(comment);
        await expect(
          receivingPage.checkStep.table.getCellValue(2, 'Comment')
        ).toContainText(comment);
        await expect(
          receivingPage.checkStep.table.getCellValue(3, 'Comment')
        ).toBeHidden();
      });


  });

  

  

  
});
