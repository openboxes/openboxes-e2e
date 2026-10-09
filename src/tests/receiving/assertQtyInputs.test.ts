import AppConfig from '@/config/AppConfig';
import { DateFormat } from '@/constants/DateFormats';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
import { deleteShipment } from '@/utils/shipmentUtils';

test.describe('Assert if quantity inputs remain when split lines', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

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
          { productId: PRODUCT_THREE.id, quantity: 200 },
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

  // After a split, the receiving table shows the replaced row (sum of the
  // split lines, read-only), the changes toggle row and the split lines
  // (original line first) right below the edited item.
  test('Assert quantity input after split line', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    const lot = `E2E-lot-${STOCK_MOVEMENT.identifier}`;
    const expDate = getDateByOffset(new Date(), 5);

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Autofill receiving quantity', async () => {
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.numberbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.numberbox
      ).toHaveValue('200');
    });

    await test.step('Open edit modal for item and split line', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('50');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.fillWithFormat(expDate, DateFormat.DISPLAY);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('50');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert quantity inputs after split line', async () => {
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Receiving now')
      ).toHaveText('100');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Lot/SN')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(5, 'Exp Date')
      ).toContainText(formatDate(expDate, DateFormat.DISPLAY));
      await expect(
        receivingPage.receivingStep.table.row(6).receivingNowField.numberbox
      ).toHaveValue('200');
    });

    await test.step('Autofill quantity after split line does not override inputs', async () => {
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(6).receivingNowField.numberbox
      ).toHaveValue('200');
    });

    await test.step('Split another line', async () => {
      await receivingPage.receivingStep.table.row(6).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('150');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.fillWithFormat(expDate, DateFormat.DISPLAY);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('50');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert quantity inputs after splitting another line', async () => {
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Receiving now')
      ).toHaveText('100');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.getCellValue(6, 'Receiving now')
      ).toHaveText('200');
      await expect(
        receivingPage.receivingStep.table.row(8).receivingNowField.numberbox
      ).toHaveValue('150');
      await expect(
        receivingPage.receivingStep.table.row(9).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.getCellValue(9, 'Lot/SN')
      ).toContainText(lot);
    });
  });

  test('Assert quantity input after split line when use save and exit', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    const lot = `E2E-lot-${STOCK_MOVEMENT.identifier}`;
    const expDate = getDateByOffset(new Date(), 5);

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Fill quantity for items and save and exit', async () => {
      await receivingPage.receivingStep.table
        .row(2)
        .receivingNowField.numberbox.fill('100');
      await receivingPage.receivingStep.table
        .row(3)
        .receivingNowField.numberbox.fill('200');
      await receivingPage.receivingStep.saveAndExitButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Return to receipt', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toBeEmpty();
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.numberbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.numberbox
      ).toHaveValue('200');
    });

    await test.step('Open edit modal for item without quantity input and split line', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await expect(
        receivingPage.receivingStep.editModal.table.row(1).receivingNowField
          .numberbox
      ).toBeEmpty();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('25');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.fillWithFormat(expDate, DateFormat.DISPLAY);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('25');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert quantity inputs after split line', async () => {
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Receiving now')
      ).toHaveText('50');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.numberbox
      ).toHaveValue('25');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.numberbox
      ).toHaveValue('25');
      await expect(
        receivingPage.receivingStep.table.getCellValue(4, 'Lot/SN')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(4, 'Exp Date')
      ).toContainText(formatDate(expDate, DateFormat.DISPLAY));
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.numberbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.row(6).receivingNowField.numberbox
      ).toHaveValue('200');
    });

    await test.step('Autofill quantity after split line does not override inputs', async () => {
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.numberbox
      ).toHaveValue('25');
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.numberbox
      ).toHaveValue('25');
      await expect(
        receivingPage.receivingStep.table.row(5).receivingNowField.numberbox
      ).toHaveValue('100');
      await expect(
        receivingPage.receivingStep.table.row(6).receivingNowField.numberbox
      ).toHaveValue('200');
    });
  });
});
