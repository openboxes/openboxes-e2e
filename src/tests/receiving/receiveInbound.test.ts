import AppConfig from '@/config/AppConfig';
import { DateFormat } from '@/constants/DateFormats';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { formatDate, getToday } from '@/utils/DateUtils';
import { deleteShipment } from '@/utils/shipmentUtils';

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

      const product = await productService.getProduct(Product.ONE);
      const product2 = await productService.getProduct(Product.TWO);

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

  test.afterEach(
    async ({
      stockMovementService,
      locationService,
      mainLocationService,
    }) => {
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });

      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await BinLocationUtils.deleteReceivingBin({
        locationService,
        mainLocationService,
        receivingBin,
      });
    }
  );

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
      await expect(
        receivingPage.receivingStep.table.row(1).getItem(item.name)
      ).toBeVisible();
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
      await receivingPage.assertColumnHeaderIsVisibleOnCheckingStep(
        'Cancel Remaining'
      );
    });

    await test.step('Assert product in checking table', async () => {
      const item = await productService.getProduct(Product.ONE);
      await expect(
        receivingPage.checkStep.table.row(1).getItem(item.name)
      ).toBeVisible();
    });

    await test.step('Assert receiving now and status on checking table', async () => {
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Receiving now')
      ).toContainText('10');
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Status')
      ).toContainText('Complete');
    });

    await test.step('Assert shipment information on checking table', async () => {
      const originName = (await supplierLocationService.getLocation()).name;
      const destinationName = (await mainLocationService.getLocation()).name;
      await receivingPage.checkStep.isLoaded();
      await expect(receivingPage.checkStep.shimpentInformation).toBeVisible();
      await expect(receivingPage.checkStep.originField).toHaveText(
        originName
      );
      await expect(receivingPage.checkStep.destinationField).toHaveText(
        destinationName
      );
      // shown with the time of shipping, which the test doesn't control
      await expect(receivingPage.checkStep.shippedOnField).toContainText(
        formatDate(TODAY, DateFormat.DISPLAY)
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

    await test.step('Fill quantity for the first item to be received', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.numberbox.fill('10');
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

  test('Assert quantities are auto-saved while receiving', async ({
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

    await test.step('Fill quantity to be received', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.numberbox.fill('8');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.numberbox.fill('8');
    });

    await test.step('Wait for autosave and leave the page', async () => {
      await receivingPage.receivingStep.autosaveStatus.isSaved();
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Return to receive page and assert qty input', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('8');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.numberbox
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

    await test.step('Fill quantity to be received', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.numberbox.fill('2');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.numberbox.fill('2');
    });

    await test.step('Click on Save and Exit button', async () => {
      await receivingPage.receivingStep.saveAndExitButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Return to receive page and assert qty input', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('2');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.numberbox
      ).toHaveValue('2');
    });
  });

  test('Clearing a qty field autosaves it as empty, not the original shipped qty', async ({
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

    await test.step('Input qty for an item to be received', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.numberbox.fill('8');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.numberbox.fill('10');
    });

    await test.step('Clear qty field and let autosave run', async () => {
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.numberbox.clear();
      await page.keyboard.press('Tab');
      await receivingPage.receivingStep.autosaveStatus.isSaved();
    });

    await test.step('Reload and assert the cleared field stayed empty', async () => {
      await page.reload();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.numberbox
      ).toHaveValue('10');
    });
  });
});

test.describe('Receive from different locations', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

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

      const product = await productService.getProduct(Product.ONE);
      const product2 = await productService.getProduct(Product.TWO);

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

  test.afterEach(async ({ authService, stockMovementService }) => {
    await authService.changeLocation(AppConfig.instance.locations.main.id);
    await deleteShipment({ stockMovementService, STOCK_MOVEMENT });
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
