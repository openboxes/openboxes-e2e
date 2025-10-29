import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getToday } from '@/utils/DateUtils';

test.describe('Assert validation on try to receive not yet shipped inbound', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

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
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Assert validation on try to receive not yet shipped inbound', async ({
    stockMovementShowPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Rollback inbound shipment', async () => {
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Validation on unable to receive not yet shipped inbound', async () => {
      await stockMovementShowPage.receiveButton.click();
      await expect(stockMovementShowPage.errorMessage).toBeVisible();
      await expect(stockMovementShowPage.errorMessage).toContainText(
        'Stock movement ' + STOCK_MOVEMENT.identifier + ' has not been shipped'
      );
    });
  });
});

test.describe('Validations on edit and receive inbound stock movement', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();

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

  test.afterEach(
    async ({
      stockMovementShowPage,
      stockMovementService,
      mainLocationService,
      page,
      locationListPage,
      createLocationPage,
    }) => {
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

      await test.step('Deactivate receiving bin', async () => {
        const mainLocation = await mainLocationService.getLocation();
        const receivingBin =
          AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
        await page.goto('./location/list');
        await locationListPage.searchByLocationNameField.fill(
          mainLocation.name
        );
        await locationListPage.findButton.click();
        await locationListPage.getLocationEditButton(mainLocation.name).click();
        await createLocationPage.binLocationTab.click();
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.searchField.fill(
          receivingBin
        );
        await createLocationPage.binLocationTabSection.searchField.press(
          'Enter'
        );
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.editBinButton.click();
        await createLocationPage.locationConfigurationTab.click();
        await createLocationPage.locationConfigurationTabSection.activeCheckbox.uncheck();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });
    }
  );

  test('Assert access to Edit page for partially received and received inbounds', async ({
    stockMovementShowPage,
    createInboundPage,
    receivingPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Display send page for shipped inbound', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.saveAndExitButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select all items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('5');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Validation on edit partially received inbound', async () => {
      await stockMovementShowPage.isLoaded();
      await expect(
        stockMovementShowPage.rollbackLastReceiptButton
      ).toBeVisible();
      await stockMovementShowPage.editButton.click();
      await expect(stockMovementShowPage.errorMessage).toBeVisible();
      await expect(stockMovementShowPage.errorMessage).toContainText(
        'Cannot edit received shipment'
      );
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Select all items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('5');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Validation on edit received inbound', async () => {
      await stockMovementShowPage.isLoaded();
      await expect(
        stockMovementShowPage.rollbackLastReceiptButton
      ).toBeVisible();
      await stockMovementShowPage.editButton.click();
      await expect(stockMovementShowPage.errorMessage).toBeVisible();
      await expect(stockMovementShowPage.errorMessage).toContainText(
        'Cannot edit received shipment'
      );
    });

    await test.step('Rollback shipment received in 2 receipts', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });
  });

  test('Assert unable to receive already received inbounds', async ({
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

    await test.step('Select all items to receive', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to Check page', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Validation on receive already received inbound', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.receiveButton.click();
      await expect(stockMovementShowPage.errorMessage).toBeVisible();
      await expect(stockMovementShowPage.errorMessage).toContainText(
        'Stock movement ' +
          STOCK_MOVEMENT.identifier +
          ' has already been received'
      );
    });
  });
});
