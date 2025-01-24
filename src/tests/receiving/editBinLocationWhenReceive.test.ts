import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getToday } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Edit Bin Location when receive inbound stock movement', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();
  const uniqueIdentifier = new UniqueIdentifier();
  const binLocationName = uniqueIdentifier.generateUniqueString('bin');

  test.beforeEach(
    async ({
      supplierLocationService,
      mainLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
      page,
      locationListPage,
      createLocationPage,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const mainLocation = await mainLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
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

      await test.step('Create bin location for location', async () => {
        await page.goto('./location/list');
        await locationListPage.searchByLocationNameField.fill(
          mainLocation.name
        );
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationEditButton(mainLocation.name)
        ).toBeVisible();
        await locationListPage.getLocationEditButton(mainLocation.name).click();
        await createLocationPage.binLocationTab.click();
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.addBinLocationButton.click();
        await createLocationPage.binLocationTabSection.addBinLocationDialog.binLocationNameField.fill(
          binLocationName
        );
        await createLocationPage.binLocationTabSection.addBinLocationDialog.saveButton.click();
      });
    }
  );

  test.afterEach(
    async ({
      stockMovementShowPage,
      stockMovementService,
      page,
      locationListPage,
      mainLocationService,
      createLocationPage,
    }) => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.rollbackLastReceiptButton.click();
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

      await test.step('Delete created bin location', async () => {
        const mainLocation = await mainLocationService.getLocation();
        await page.goto('./location/list');
        await locationListPage.searchByLocationNameField.fill(
          mainLocation.name
        );
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationEditButton(mainLocation.name)
        ).toBeVisible();
        await locationListPage.getLocationEditButton(mainLocation.name).click();
        await createLocationPage.binLocationTab.click();
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.searchField.fill(
          binLocationName
        );
        await createLocationPage.binLocationTabSection.searchField.press(
          'Enter'
        );
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.deleteBinButton.click();
        await createLocationPage.binLocationTabSection.isLoaded();
      });
    }
  );

  test('Edit Bin location when receive', async ({
    stockMovementShowPage,
    receivingPage,
    productShowPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Edit bin when receive item', async () => {
      await receivingPage.receivingStep.isLoaded();
      await receivingPage.receivingStep.table.row(1).binLocationSelect.click();
      await receivingPage.receivingStep.table
        .row(1)
        .getBinLocation(binLocationName)
        .click();
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.textbox.fill('10');
    });

    await test.step('Go to check page', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Finish receipt of item', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert edited bin on Packing list', async () => {
      await expect(
        stockMovementShowPage.packingListTable.row(1).binLocation
      ).toHaveText(binLocationName);
    });

    await test.step('Go to product page and assert bin location', async () => {
      await stockMovementShowPage.packingListTable.row(1).product.click();
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(binLocationName);
    });
  });
});
