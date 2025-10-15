import AppConfig from '@/config/AppConfig';
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
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        description,
        dateRequested,
      });

      productService.setProduct('1');
      const product = await productService.getProduct();
      productService.setProduct('2');
      const product2 = await productService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: product.id, quantity: 10 },
          { productId: product2.id, quantity: 10 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    const isButtonVisible =
      await stockMovementShowPage.rollbackLastReceiptButton.isVisible();

    // due to failed test, shipment might not be received which will not show the button
    if (isButtonVisible) {
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    }

    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Receive inbound stock movement', async ({
    stockMovementShowPage,
    receivingPage,
    supplierLocationService,
    mainLocationService,
    productService,
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
      productService.setProduct('1');
      const item = await productService.getProduct();
      await receivingPage.receivingStep.table.row(1).getItem(item.name).hover();
      await expect(receivingPage.tooltip).toContainText(item.name);
    });

    await test.step('Select all items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
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
      productService.setProduct('1');
      const item = await productService.getProduct();
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

  test('Receiving should be available from location that is specfied as destination location', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
    });

    await test.step('Assert that receiving page is loaded', async () => {
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Check first item to be received', async () => {
      await receivingPage.receivingStep.table.row(1).checkbox.check();
    });

    await test.step('Go to check page', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });

  test('Use Save button in receiving and assert saved qty', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Check first item to be received', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('8');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('8');
    });

    await test.step('Click on Save button', async () => {
      await receivingPage.receivingStep.saveButton.click();
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Return to receive page and assert qty input', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('8');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('8');
    });
  });

  test('Use Save and Exit button in receiving and assert saved qty', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Check first item to be received', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('2');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('2');
    });

    await test.step('Click on Save and Exit button', async () => {
      await receivingPage.receivingStep.saveAndExitButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Return to receive page and assert qty input', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('2');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('2');
    });
  });

  test.skip('Use Save button after removing qty and default to 0', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Input qty for an item to be received', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('8');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Clear qty field and click on Save button', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.clear();
      await receivingPage.receivingStep.saveButton.click();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.textbox
      ).toHaveValue('0');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.textbox
      ).toHaveValue('10');
    });
  });

  test.describe('Receive from different locations', () => {
    test.afterEach(async ({ authService }) => {
      await authService.changeLocation(AppConfig.instance.locations.main.id);
    });

    test('Receiving should not be available from other location than which is specfied as destination location', async ({
      stockMovementShowPage,
      depotLocationService,
      navbar,
      locationChooser,
    }) => {
      const OTHER_LOCATION = await depotLocationService.getLocation();

      await test.step('Go to stock movement show page', async () => {
        await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Switch locations', async () => {
        await navbar.locationChooserButton.click();
        await locationChooser
          .getOrganization(OTHER_LOCATION.organization?.name as string)
          .click();
        await locationChooser.getLocation(OTHER_LOCATION.name).click();
      });

      await test.step('Assert location in location chooser button should be updated', async () => {
        await expect(navbar.locationChooserButton).toContainText(
          OTHER_LOCATION.name
        );
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Start receving process', async () => {
        await stockMovementShowPage.receiveButton.click();
      });

      await test.step('Assert error on stock movement show page', async () => {
        await stockMovementShowPage.isLoaded();
        await expect(stockMovementShowPage.errorMessage).toBeVisible();
        await expect(stockMovementShowPage.errorMessage).toContainText(
          'To receive this Stock Movement, please log in to the destination location'
        );
      });
    });
  });
});
