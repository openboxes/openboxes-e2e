import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';

test.describe('Apply sorting by alphabetical order and remain inputs', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const TODAY = getToday();
  const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
  const SHIPMENT_TYPE = 'Air';

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      productService.setProduct('3');
      const PRODUCT_THREE = await productService.getProduct();
      productService.setProduct('4');
      const PRODUCT_FOUR = await productService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: PRODUCT_THREE.id, quantity: 50 },
          { productId: PRODUCT_FOUR.id, quantity: 200 },
        ]
      );
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

  test('Apply sorting by alphabetical order and remain inputs', async ({
    stockMovementShowPage,
    receivingPage,
    productService,
    createInboundPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Edit created shipment and add item', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.previousButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.addItemsStep.reloadButton.click();
      await createInboundPage.addItemsStep.confirmReloadPopup.yesButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.addItemsStep.addLineButton.click();
      productService.setProduct('5');
      const item = await productService.getProduct();
      const row = createInboundPage.addItemsStep.table.row(2);
      await row.productSelect.findAndSelectOption(item.name);
      await row.quantityField.numberbox.fill('100');
    });

    await test.step('Send shipment', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input receiving qty for all lines', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('50');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('50');
      await receivingPage.receivingStep.table
        .row(3)
        .receivingNowField.textbox.fill('50');
    });

    await test.step('Change ordering to alphabetical and assert order', async () => {
      productService.setProduct('5');
      const item = await productService.getProduct();
      await receivingPage.receivingStep.table.row(3).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
      await expect(receivingPage.receivingStep.orderSelect).toBeVisible();
      await expect(
        receivingPage.receivingStep.orderSelect.locator(
          '.react-select__clear-indicator'
        )
      ).toBeHidden();
      await receivingPage.receivingStep.orderSelect.click();
      await receivingPage.receivingStep.getOrder('Alphabetical Order').click();
      await receivingPage.receivingStep.table.row(1).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.textbox
      ).toHaveValue('50');
    });

    await test.step('Go to check page and assert applied order', async () => {
      productService.setProduct('5');
      const item = await productService.getProduct();
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.table.row(1).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
    });

    await test.step('Go back to receive page and change order to shipment', async () => {
      productService.setProduct('5');
      const item = await productService.getProduct();
      await receivingPage.checkStep.backToEditButton.click();
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.orderSelect.click();
      await receivingPage.receivingStep.getOrder('Shipment Order').click();
      await receivingPage.receivingStep.table.row(3).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });
});
