import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { getDateByOffset } from '@/utils/DateUtils';
import { deleteShipment } from '@/utils/shipmentUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Edit qty of original line to 0', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const lot = uniqueIdentifier.generateUniqueString('lot');

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await productService.getProduct(Product.ONE);
      const PRODUCT_TWO = await productService.getProduct(Product.TWO);
      const PRODUCT_THREE = await productService.getProduct(Product.THREE);
      const PRODUCT_FOUR = await productService.getProduct(Product.FOUR);
      const PRODUCT_FIVE = await productService.getProduct(Product.FIVE);

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_ONE.id,
            quantity: 50,
          },
          { productId: PRODUCT_TWO.id, quantity: 100 },
          {
            productId: PRODUCT_THREE.id,
            quantity: 200,
            lotNumber: lot,
            expirationDate: getDateByOffset(new Date(), 3),
          },
          { productId: PRODUCT_THREE.id, quantity: 50 },
          { productId: PRODUCT_FOUR.id, quantity: 200 },
          { productId: PRODUCT_FIVE.id, quantity: 100 },
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

  test('Edit qty of original line to 0', async ({
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

    await test.step('Open edit modal for item with lot and move its qty to a line without lot', async () => {
      await receivingPage.receivingStep.table.row(3).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('0');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('200');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    // The original line received with 0 is not listed among the changes, so
    // the item with lot shows the replaced row (3), the changes toggle row (4)
    // and only the new line without lot (5).
    await test.step('Assert original line with qty 0 is not visible', async () => {
      await expect(receivingPage.receivingStep.table.rows).toHaveCount(8);
      await expect(
        receivingPage.receivingStep.table.getCellValue(3, 'Lot/SN')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(3, 'Receiving now')
      ).toHaveText('200');
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.numberbox
      ).toHaveValue('200');
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Lot/SN')
      ).toBeEmpty();
    });

    await test.step('Input receiving qty for item without lot', async () => {
      await receivingPage.receivingStep.table
        .row(6)
        .receivingNowField.numberbox.fill('50');
    });

    await test.step('Assert lot on check step', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(receivingPage.checkStep.table.rows).toHaveCount(4);
      await expect(
        receivingPage.checkStep.table.getCellValue(3, 'Receiving now')
      ).toHaveText('200');
      await expect(
        receivingPage.checkStep.table.getCellValue(3, 'Lot/SN')
      ).toBeEmpty();
      await expect(
        receivingPage.checkStep.table.getCellValue(4, 'Receiving now')
      ).toHaveText('50');
      await expect(
        receivingPage.checkStep.table.getCellValue(4, 'Lot/SN')
      ).toBeEmpty();
    });

    await test.step('Return to receiving step and assert original line is not visible', async () => {
      await receivingPage.checkStep.backToEditButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(receivingPage.receivingStep.table.rows).toHaveCount(8);
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.numberbox
      ).toHaveValue('200');
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Lot/SN')
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(6).receivingNowField.numberbox
      ).toHaveValue('50');
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert nothing was received with lot on Receipt tab', async () => {
      await stockMovementShowPage.openReceiptsTab();
      await expect(
        stockMovementShowPage.receiptListTable.getRowByText(lot)
          .quantityReceived
      ).toHaveText('0');
    });

    await test.step('Assert received lines on Packing list', async () => {
      await stockMovementShowPage.openPackingListTab();
      await expect(
        stockMovementShowPage.packingListTable.rows.filter({ hasText: lot })
      ).toHaveCount(0);
    });
  });
});

test.describe('Edit original line to other product in the middle of receipt', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_FOUR = await productService.getProduct(Product.FOUR);

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: PRODUCT_FOUR.id, quantity: 10 }]
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

  test('Edit qty of original line to 0 and edit product to other', async ({
    stockMovementShowPage,
    receivingPage,
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

    await test.step('Open edit modal for item and change product of new line', async () => {
      const PRODUCT_FIVE = await productService.getProduct(Product.FIVE);
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('0');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .clearProductSelect.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .getProductSelect(PRODUCT_FIVE.name);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert original line is replaced by line with other product', async () => {
      const PRODUCT_FOUR = await productService.getProduct(Product.FOUR);
      const PRODUCT_FIVE = await productService.getProduct(Product.FIVE);
      await expect(receivingPage.receivingStep.table.rows).toHaveCount(3);
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Product')
      ).toContainText(PRODUCT_FOUR.name);
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Receiving now')
      ).toHaveText('10');
      await expect(
        receivingPage.receivingStep.table.getCellValue(3, 'Product')
      ).toContainText(PRODUCT_FIVE.name);
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.numberbox
      ).toHaveValue('10');
    });

    await test.step('Assert product name on check step', async () => {
      const PRODUCT_FIVE = await productService.getProduct(Product.FIVE);
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await expect(
        receivingPage.checkStep.table.getCellValue(3, 'Product')
      ).toContainText(PRODUCT_FIVE.name);
      await expect(
        receivingPage.checkStep.table.getCellValue(3, 'Receiving now')
      ).toHaveText('10');
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert received product on stock movement show page', async () => {
      const PRODUCT_FOUR = await productService.getProduct(Product.FOUR);
      const PRODUCT_FIVE = await productService.getProduct(Product.FIVE);
      await stockMovementShowPage.openPackingListTab();
      await expect(
        stockMovementShowPage.packingListTable.row(1).product
      ).toHaveText(PRODUCT_FOUR.name);
      await stockMovementShowPage.openReceiptsTab();
      await expect(
        stockMovementShowPage.receiptListTable.getRowByText(PRODUCT_FIVE.name)
          .quantityReceived
      ).toHaveText('10');
    });
  });
});
