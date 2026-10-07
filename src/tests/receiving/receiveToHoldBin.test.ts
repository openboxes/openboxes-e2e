import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { deleteShipment } from '@/utils/shipmentUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Receive item into hold bin', () => {
  test.describe.configure({ timeout: 60000 });
  //timeout has been added for this test to make sure that the content on bin location tab will load as it can include a lot of data
  let STOCK_MOVEMENT: StockMovementResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const holdBinLocationName = uniqueIdentifier.generateUniqueString('holdbin');

  test.beforeEach(
    async ({
      supplierLocationService,
      mainLocationService,
      stockMovementService,
      productService,
      page,
      locationListPage,
      createLocationPage,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await productService.getProduct(Product.ONE);

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: PRODUCT_ONE.id, quantity: 20 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });

      await test.step('Create bin location with hold stock activity for location', async () => {
        await BinLocationUtils.createHoldBin({
          mainLocationService,
          locationListPage,
          createLocationPage,
          page,
          holdBinLocationName,
        });
      });
    }
  );

  test.afterEach(
    async ({
      stockMovementService,
      locationService,
      page,
      locationListPage,
      mainLocationService,
      createLocationPage,
    }) => {
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
      await deleteShipment({ stockMovementService, STOCK_MOVEMENT });

      await test.step('Deactivate created bin location', async () => {
        await BinLocationUtils.deactivateCreatedBin({
          mainLocationService,
          locationListPage,
          createLocationPage,
          page,
          binLocationName: holdBinLocationName,
        });
      });

      await BinLocationUtils.deleteReceivingBin({
        locationService,
        mainLocationService,
        receivingBin,
      });
    }
  );

  test('Receive to hold bin', async ({
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
      await receivingPage.receivingStep.enableShowPutaway();
      await receivingPage.receivingStep.table
        .row(1)
        .selectBinLocation(holdBinLocationName);
      await expect(
        receivingPage.receivingStep.table.row(1).selectedBinLocation
      ).toHaveText(holdBinLocationName);
      await receivingPage.receivingStep.table
        .row(1)
        .receivingNowField.numberbox.fill('10');
    });

    await test.step('Go to check page', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Assert hold bin on check page and finish receipt of item', async () => {
      await expect(
        receivingPage.checkStep.table.getCellValue(1, 'Location')
      ).toHaveText(holdBinLocationName);
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert edited bin on Packing list', async () => {
      await stockMovementShowPage.packingListTable.isLoaded();
      await expect(
        stockMovementShowPage.packingListTable.row(1).binLocation
      ).toHaveText(holdBinLocationName);
    });

    await test.step('Go to product page and assert bin location', async () => {
      await stockMovementShowPage.packingListTable.row(1).product.click();
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      // the product has stock in other bins too, so the row order isn't fixed
      const rowIndex =
        await productShowPage.inStockTabSection.getRowIndexByBinLocation(
          holdBinLocationName
        );
      const row = productShowPage.inStockTabSection.row(rowIndex);
      await expect(row.binLocation).toHaveText(holdBinLocationName);
      await expect(row.row).toHaveAttribute(
        'title',
        'This bin has been restricted'
      );
      await expect(row.inventoryInformation).toHaveText('Hold');
    });
  });
});
