import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate } from '@/utils/DateUtils';

test.describe('Receive inbound stock movement', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = new Date();

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
        [{ productId: product.id, quantity: 2 }]
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
      await receivingPage.receivingStep.table.getColumnHeader('Code').hover();
      await expect(page.getByRole('tooltip')).toContainText('Code');
      await receivingPage.receivingStep.table.codeColumn.hover();
      await expect(page.getByRole('tooltip')).toContainText('Code');
    });

    await test.step('Select all items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('2');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });
});
