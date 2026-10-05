import AppConfig from '@/config/AppConfig';
import { DateFormat } from '@/constants/DateFormats';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import { formatDate, getToday } from '@/utils/DateUtils';
import { deleteShipment } from '@/utils/shipmentUtils';

test.describe('Receive inbound stock movement in location without partial receiving', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      depotLocationService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const depotLocation = await depotLocationService.getLocation();
      const PRODUCT_ONE = await productService.getProduct(Product.ONE);
      const PRODUCT_TWO = await productService.getProduct(Product.TWO);

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

  test.afterEach(async ({ authService, stockMovementService }) => {
    // the shipment must be deleted while the session is still at the depot,
    // but the location has to be restored even when the cleanup fails,
    // otherwise the next test file runs against the wrong location
    try {
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });
    } finally {
      await authService.changeLocation(AppConfig.instance.locations.main.id);
    }
  });

  test('Assert Confirm receiving dialog and select No, receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
    supplierLocationService,
    depotLocationService,
    productService,
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
        date: formatDate(dateRequested, DateFormat.DISPLAY),
      });
    });

    await test.step('Assert table column headers on receiving page', async () => {
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep('Code');
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Product'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Shipped'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Status'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Actions'
      );
    });

    await test.step('Assert product in receiving table', async () => {
      const item = await productService.getProduct(Product.ONE);
      const item2 = await productService.getProduct(Product.TWO);
      await expect(
        receivingPage.receivingStep.table.row(1).getItem(item.name)
      ).toBeVisible();
      await expect(
        receivingPage.receivingStep.table.row(2).getItem(item2.name)
      ).toBeVisible();
    });

    await test.step('Select item to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.numberbox.fill('20');
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
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('20');
    });
  });

  test('Assert Confirm receiving dialog and select Yes, receive 1 item fully', async ({
    stockMovementShowPage,
    receivingPage,
    supplierLocationService,
    depotLocationService,
    productService,
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
        .receivingNowField.numberbox.fill('20');
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
        date: formatDate(dateRequested, DateFormat.DISPLAY),
      });
    });

    await test.step('Assert table column headers on checking page', async () => {
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep('Code');
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Product'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Shipped'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Receiving now'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep('Status');
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Location'
      );
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Actions'
      );
      // locations without partial receiving support auto-resolve every line
      // to Complete/Cancelled on receipt, so there's nothing left to cancel
      // later and the column doesn't render here.
    });

    await test.step('Assert product in checking table', async () => {
      const item = await productService.getProduct(Product.ONE);
      const item2 = await productService.getProduct(Product.TWO);
      await expect(
        receivingPage.checkStep.table.row(1).getItem(item.name)
      ).toBeVisible();
      await expect(
        receivingPage.checkStep.table.row(2).getItem(item2.name)
      ).toBeVisible();
    });

    await test.step('Assert receiving now and status on checking table', async () => {
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
      ).toContainText('20');
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Status')
      ).toContainText('Complete');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Receiving now')
      ).toContainText('0');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Status')
      ).toContainText('10 cancelled');
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
        .receivingNowField.numberbox.fill('15');
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.numberbox.fill('10');
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

    await test.step('Assert receiving now and status on checking table', async () => {
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
      ).toContainText('15');
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Status')
      ).toContainText('5 cancelled');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Receiving now')
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(2, 'Status')
      ).toContainText('Complete');
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });
});
