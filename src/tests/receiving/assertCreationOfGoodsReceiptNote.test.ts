import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Assert Goods Receipt Note is created and opened', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      thirdProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_THREE = await thirdProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: PRODUCT_ONE.id, quantity: 20 },
          { productId: PRODUCT_THREE.id, quantity: 10 },
        ]
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
      await stockMovementShowPage.rollbackLastReceiptButton.click();
      await stockMovementShowPage.rollbackButton.click();
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

  test('Assert Goods Receipt note is created', async ({
    stockMovementShowPage,
    receivingPage,
    page,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to Documnents tab and assert Goods receipt note is not visible', async () => {
      await stockMovementShowPage.documentTab.click();
      await expect(
        stockMovementShowPage.documentsListTable
          .row(7)
          .getDocumentName('Goods Receipt Note')
      ).toBeHidden();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Receive shipment partially', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and finish receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Goods receipt note is created and opened for partially received shipment', async () => {
      await stockMovementShowPage.documentTab.click();
      await expect(
        stockMovementShowPage.documentsListTable
          .row(7)
          .getDocumentName('Goods Receipt Note')
      ).toBeVisible();
      const popupPromise = page.waitForEvent('popup');
      await stockMovementShowPage.documentsListTable
        .row(7)
        .downloadButton.click();
      const popup = await popupPromise;
      await expect(popup.locator('.title')).toHaveText('Goods Receipt Note');
      await popup.close();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Receive shipment fully', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page and finish 2nd receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Goods receipt note is created and opened for received shipment', async () => {
      await stockMovementShowPage.documentTab.click();
      await expect(
        stockMovementShowPage.documentsListTable
          .row(7)
          .getDocumentName('Goods Receipt Note')
      ).toBeVisible();
      const popupPromise = page.waitForEvent('popup');
      await stockMovementShowPage.documentsListTable
        .row(7)
        .downloadButton.click();
      const popup = await popupPromise;
      await expect(popup.locator('.title')).toHaveText('Goods Receipt Note');
      await popup.close();
    });

    await test.step('Rollback shipment received in 2 receipts', async () => {
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackLastReceiptButton.click();
    });
  });
});
