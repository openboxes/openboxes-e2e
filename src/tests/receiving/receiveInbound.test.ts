import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getToday } from '@/utils/DateUtils';

test.describe('Receive inbound stock movement', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();
  const TODAY = getToday();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        description,
        dateRequested,
      });

      const product = await mainProductService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 10 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    await stockMovementShowPage.rollbackLastReceiptButton.click();
    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Receive inbound stock movement', async ({
    stockMovementShowPage,
    receivingPage,
    supplierLocationService,
    mainLocationService,
    mainProductService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert header on receiving page', async () => {
      const supplierLocation = await supplierLocationService.getLocation();
      const mainLocation = await mainLocationService.getLocation();
      await receivingPage.assertHeaderIsVisible({
        origin: supplierLocation.name,
        destination: mainLocation.name,
        description: description,
        date: formatDate(dateRequested),
      });
    });

    await test.step('Assert table column headers on receiving page', async () => {
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Pack level 1'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Pack level 2'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Code');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Product');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Lot/Serial No.'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Expiration date'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Bin Location'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Recipient');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Shipped');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Received');
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'To receive'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Comment');
    });

    await test.step('Assert product in receiving table', async () => {
      const item = await mainProductService.getProduct();
      await receivingPage.receivingStep.table.row(1).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
    });

    await test.step('Select all items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Assert header on checking page', async () => {
      const supplierLocation = await supplierLocationService.getLocation();
      const mainLocation = await mainLocationService.getLocation();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.assertHeaderIsVisible({
        origin: supplierLocation.name,
        destination: mainLocation.name,
        description: description,
        date: formatDate(dateRequested),
      });
    });

    await test.step('Assert table column headers on checking page', async () => {
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Pack level 1'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Pack level 2'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Code');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Product');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Lot/Serial No.'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Expiration date'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Bin Location'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Recipient');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Remaining');
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep(
        'Cancel remaining'
      );
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Comment');
    });

    await test.step('Assert product in checking table', async () => {
      const item = await mainProductService.getProduct();
      await receivingPage.checkStep.table.row(1).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
    });

    await test.step('Assert receiving now and remaining qty on checking table', async () => {
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toContainText('0');
    });

    await test.step('Assert shipment information on checking table', async () => {
      const originName = (await supplierLocationService.getLocation()).name;
      const destinationName = (await mainLocationService.getLocation()).name;
      await receivingPage.checkStep.isLoaded();
      await expect(receivingPage.checkStep.shimpentInformation).toBeVisible();
      await expect(receivingPage.checkStep.originField).toHaveValue(originName);
      await expect(receivingPage.checkStep.destinationField).toHaveValue(
        destinationName
      );
      await expect(receivingPage.checkStep.shippedOnField).toHaveValue(
        formatDate(TODAY)
      );
      await expect(receivingPage.checkStep.shippedOnField).toHaveValue(
        formatDate(TODAY)
      );
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });
});
