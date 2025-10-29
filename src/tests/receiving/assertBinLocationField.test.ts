import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Assert bin location not clearable', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      fourthProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_FOUR = await fourthProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_FOUR.id,
            quantity: 10,
          },
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

  test('Assert bin location not clearable', async ({
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

    await test.step('Assert bin location cant be cleared', async () => {
      await expect(
        receivingPage.receivingStep.table
          .row(1)
          .binLocationSelect.locator('.react-select__clear-indicator')
      ).toBeHidden();
    });

    await test.step('Split lines', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .quantityShippedField.numberbox.fill('5');
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .quantityShippedField.numberbox.fill('5');
      await receivingPage.receivingStep.editModal.saveButton.click();
    });

    await test.step('Assert bin location field content after split line', async () => {
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await expect(
        receivingPage.receivingStep.table.row(1).binLocationSelect
      ).toHaveText(receivingBin);
      await expect(
        receivingPage.receivingStep.table.row(2).binLocationSelect
      ).toHaveText(receivingBin);
      await expect(
        receivingPage.receivingStep.table
          .row(1)
          .binLocationSelect.locator('.react-select__clear-indicator')
      ).toBeHidden();
      await expect(
        receivingPage.receivingStep.table
          .row(2)
          .binLocationSelect.locator('.react-select__clear-indicator')
      ).toBeHidden();
    });
  });
});
