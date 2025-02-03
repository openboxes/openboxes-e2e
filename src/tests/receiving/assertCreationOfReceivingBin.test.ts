import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import CreateLocationPage from '@/pages/location/createLocation/CreateLocationPage';
import LocationListPage from '@/pages/location/LocationListPage';
import { StockMovementResponse } from '@/types';

test.describe('Assert creation of receiving bin', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_ONE.id,
            quantity: 100,
          },
          { productId: PRODUCT_TWO.id, quantity: 10 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Assert receiving bin is not created when shipment is shipped', async ({
    stockMovementShowPage,
    receivingPage,
    page,
    locationListPage,
    mainLocationService,
    createLocationPage,
    browser,
  }) => {
    await test.step('Go to stock movement show page and assert shipped status', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Go to Bin location tab of edit location page', async () => {
      const mainLocation = await mainLocationService.getLocation();
      await page.goto('./location/list');
      await locationListPage.searchByLocationNameField.fill(mainLocation.name);
      await locationListPage.findButton.click();
      await expect(
        locationListPage.getLocationEditButton(mainLocation.name)
      ).toBeVisible();
      await locationListPage.getLocationEditButton(mainLocation.name).click();
      await createLocationPage.binLocationTab.click();
      await createLocationPage.binLocationTabSection.isLoaded();
    });

    await test.step('Assert Bin location is not created yet', async () => {
      const receivingBin = 'R-' + STOCK_MOVEMENT.identifier;
      await createLocationPage.binLocationTabSection.searchField.fill(
        receivingBin
      );
      await createLocationPage.binLocationTabSection.searchField.press('Enter');
      await createLocationPage.binLocationTabSection.isLoaded();
      await page.waitForTimeout(1000);
      await expect(
        createLocationPage.binLocationTabSection.emptyBinLocationTable
      ).toBeVisible();
    });

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Click on receive button', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert receiving bin has been created', async () => {
      const newPage = await browser.newPage();
      const newLocationListPage = new LocationListPage(newPage);
      const newCreateLocationPage = new CreateLocationPage(newPage);
      const mainLocation = await mainLocationService.getLocation();
      await newPage.goto('./location/list');
      await newLocationListPage.searchByLocationNameField.fill(
        mainLocation.name
      );
      await newLocationListPage.findButton.click();
      await expect(
        newLocationListPage.getLocationEditButton(mainLocation.name)
      ).toBeVisible();
      await newLocationListPage
        .getLocationEditButton(mainLocation.name)
        .click();
      await newCreateLocationPage.binLocationTab.click();
      await newCreateLocationPage.binLocationTabSection.isLoaded();
      const receivingBin = 'R-' + STOCK_MOVEMENT.identifier;
      await newCreateLocationPage.binLocationTabSection.searchField.fill(
        receivingBin
      );
      await newCreateLocationPage.binLocationTabSection.searchField.press(
        'Enter'
      );
      await newCreateLocationPage.binLocationTabSection.isLoaded();
      await newPage.waitForTimeout(1000);
      await expect(
        newCreateLocationPage.binLocationTabSection.emptyBinLocationTable
      ).toBeHidden();
      await expect(
        newCreateLocationPage.binLocationTabSection.row(1).binLocation
      ).toHaveText(receivingBin);
      await newPage.close();
    });
  });
});
