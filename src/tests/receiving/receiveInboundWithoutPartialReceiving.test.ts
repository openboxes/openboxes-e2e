import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getToday } from '@/utils/DateUtils';

test.describe('Receive inbound stock movement in location without partial receiving', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
      depotLocationService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const depotLocation = await depotLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        destinationId: depotLocation.id,
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

  test.afterEach(async ({ stockMovementShowPage, authService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    const isRollbackLastReceiptButtonVisible =
      await stockMovementShowPage.rollbackLastReceiptButton.isVisible();
    const isRollbackButtonVisible =
      await stockMovementShowPage.rollbackButton.isVisible();

    if (isRollbackLastReceiptButtonVisible) {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    }

    if (isRollbackButtonVisible) {
      await stockMovementShowPage.rollbackButton.click();
    }

    await stockMovementShowPage.clickDeleteShipment();
    await authService.changeLocation(AppConfig.instance.locations.main.id);
  });

  test('Assert Confirm receiving dialog and select No, receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
    supplierLocationService,
    depotLocationService,
    mainProductService,
    otherProductService,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert header on receiving page', async () => {
      const supplierLocation = await supplierLocationService.getLocation();
      const depotLocation = await depotLocationService.getLocation();
      await receivingPage.assertHeaderIsVisible({
        origin: supplierLocation.name,
        destination: depotLocation.name,
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
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderTooltipOnReceivingStep('Comment');
    });

    await test.step('Assert product in receiving table', async () => {
      const item = await mainProductService.getProduct();
      const item2 = await otherProductService.getProduct();
      await receivingPage.receivingStep.table.row(1).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
      await receivingPage.receivingStep.table
        .row(2)
        .getItem(item2.name)
        .hover();
      await expect(receivingPage.tooltip).toContainText(item2.name);
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
    });

    await test.step('Try to go to next page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Assert Confirm receiving dialog', async () => {
      await expect(
        receivingPage.receivingStep.confirmReceivingDialog
      ).toBeVisible();
    });

    await test.step('Select No on Confirm receiving dialog', async () => {
      await receivingPage.receivingStep.rejectConfirmReceivingDialog.click();
    });

    await test.step('Assert receiving page is visible', async () => {
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('20');
    });
  });

  test('Assert Confirm receiving dialog and select Yes, receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
    supplierLocationService,
    depotLocationService,
    mainProductService,
    otherProductService,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('20');
    });

    await test.step('Try to go to next page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Assert Confirm receiving dialog', async () => {
      await expect(
        receivingPage.receivingStep.confirmReceivingDialog
      ).toBeVisible();
    });

    await test.step('Select Yes on Confirm receiving dialog', async () => {
      await receivingPage.receivingStep.acceptConfirmReceivingDialog.click();
    });

    await test.step('Assert checking page is visible', async () => {
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Assert header on checking page', async () => {
      const supplierLocation = await supplierLocationService.getLocation();
      const depotLocation = await depotLocationService.getLocation();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.assertHeaderIsVisible({
        origin: supplierLocation.name,
        destination: depotLocation.name,
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
      await receivingPage.assertColumnHeaderTooltipOnCheckingStep('Comment');
    });

    await test.step('Assert product in checking table', async () => {
      const item = await mainProductService.getProduct();
      const item2 = await otherProductService.getProduct();
      await receivingPage.checkStep.table.row(1).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
      await receivingPage.receivingStep.table
        .row(2)
        .getItem(item2.name)
        .hover();
      await expect(receivingPage.tooltip).toContainText(item2.name);
    });

    await test.step('Assert receiving now and remaining qty on checking table', async () => {
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
      ).toContainText('20');
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toContainText('0');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Receiving now')
      ).toContainText('0');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Remaining')
      ).toContainText('10');
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });

  test('Assert Confirm receiving dialog not visible when receive all items, 1 partially', async ({
    stockMovementShowPage,
    receivingPage,
    authService,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await authService.changeLocation(AppConfig.instance.locations.depot.id);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('15');
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Try to go to next page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Assert Confirm receiving dialog', async () => {
      await expect(
        receivingPage.receivingStep.confirmReceivingDialog
      ).toBeHidden();
    });

    await test.step('Assert checking page is visible', async () => {
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Assert receiving now and remaining qty on checking table', async () => {
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
      ).toContainText('15');
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Remaining')
      ).toContainText('5');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Receiving now')
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Remaining')
      ).toContainText('0');
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });
});
