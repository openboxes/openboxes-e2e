import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getToday } from '@/utils/DateUtils';

test.describe('Receive inbound stock movement', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = new Date();
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
    page,
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
      await receivingPage.receivingStep.table
        .getColumnHeader('Pack level 1')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Pack level 1');
      await receivingPage.receivingStep.table
        .getColumnHeader('Pack level 2')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Pack level 2');
      await receivingPage.receivingStep.table.getColumnHeader('Code').hover();
      await expect(page.getByRole('tooltip')).toContainText('Code');
      await receivingPage.receivingStep.table
        .getColumnHeader('Product')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Product');
      await receivingPage.receivingStep.table
        .getColumnHeader('Lot/Serial No.')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Lot/Serial No.');
      await receivingPage.receivingStep.table
        .getColumnHeader('Expiration date')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Expiration date');
      await receivingPage.receivingStep.table
        .getColumnHeader('Bin Location')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Bin Location');
      await receivingPage.receivingStep.table
        .getColumnHeader('Recipient')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Recipient');
      await receivingPage.receivingStep.table
        .getColumnHeader('Shipped')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Shipped');
      await receivingPage.receivingStep.table
        .getColumnHeader('Received')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Received');
      await receivingPage.receivingStep.table
        .getColumnHeader('To receive')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('To receive');
      await receivingPage.receivingStep.table
        .getColumnHeader('Receiving now')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Receiving now');
      await receivingPage.receivingStep.table
        .getColumnHeader('Comment')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Comment');
    });

    await test.step('Assert product in receiving table', async () => {
      const itemName = await mainProductService.getProduct();
      await receivingPage.receivingStep.table
        .row(1)
        .getitem(itemName.name)
        .hover();
      await expect(page.getByRole('tooltip')).toContainText(itemName.name);
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
      await receivingPage.checkStep.table
        .getColumnHeader('Pack level 1')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Pack level 1');
      await receivingPage.checkStep.table
        .getColumnHeader('Pack level 2')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Pack level 2');
      await receivingPage.checkStep.table.getColumnHeader('Code').hover();
      await expect(page.getByRole('tooltip')).toContainText('Code');
      await receivingPage.checkStep.table.getColumnHeader('Product').hover();
      await expect(page.getByRole('tooltip')).toContainText('Product');
      await receivingPage.checkStep.table
        .getColumnHeader('Lot/Serial No.')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Lot/Serial No.');
      await receivingPage.checkStep.table
        .getColumnHeader('Expiration date')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Expiration date');
      await receivingPage.checkStep.table
        .getColumnHeader('Bin Location')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Bin Location');
      await receivingPage.checkStep.table.getColumnHeader('Recipient').hover();
      await expect(page.getByRole('tooltip')).toContainText('Recipient');
      await receivingPage.checkStep.table
        .getColumnHeader('Receiving now')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Receiving now');
      await receivingPage.checkStep.table.getColumnHeader('Remaining').hover();
      await expect(page.getByRole('tooltip')).toContainText('Remaining');
      await receivingPage.checkStep.table
        .getColumnHeader('Cancel remaining')
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Cancel remaining');
      await receivingPage.checkStep.table.getColumnHeader('Comment').hover();
      await expect(page.getByRole('tooltip')).toContainText('Comment');
    });

    await test.step('Assert product in checking table', async () => {
      const itemName = await mainProductService.getProduct();
      await receivingPage.checkStep.table.row(1).getitem(itemName.name).hover();
      await expect(page.getByRole('tooltip')).toContainText(itemName.name);
    });

    await test.step('Assert receiving now and remaining qty on checking table', async () => {
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.receivingNowColumnContent
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.remainingColumnContent
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
