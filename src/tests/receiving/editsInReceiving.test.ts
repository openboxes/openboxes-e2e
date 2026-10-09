import AppConfig from '@/config/AppConfig';
import { DateFormat } from '@/constants/DateFormats';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { formatDate, getDateByOffset, getToday } from '@/utils/DateUtils';
import { deleteShipment } from '@/utils/shipmentUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Edit items in the middle of receipt', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  const description = 'some description';
  const dateRequested = getToday();
  const uniqueIdentifier = new UniqueIdentifier();

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_ONE = await productService.getProduct(Product.ONE);
      const PRODUCT_TWO = await productService.getProduct(Product.TWO);

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
        description,
        dateRequested,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_ONE.id,
            quantity: 20,
            lotNumber: uniqueIdentifier.generateUniqueString('lot'),
            expirationDate: getDateByOffset(new Date(), 3),
          },
          { productId: PRODUCT_TWO.id, quantity: 10 },
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

  test('Edit item qty on receiving page', async ({
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

    await test.step('Open edit modal for 1st item and edit qty to higher value', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('50');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal for 2nd item and edit qty to lower value', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('2');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert receiving qty and status after edits for both items', async () => {
      await expect(
        receivingPage.receivingStep.table.row(1).receivingNowField.numberbox
      ).toHaveValue('50');
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Status')
      ).toHaveText('30 over');
      await expect(
        receivingPage.receivingStep.table.row(2).receivingNowField.numberbox
      ).toHaveValue('2');
      await expect(
        receivingPage.receivingStep.table.getCellValue(2, 'Status')
      ).toHaveText('8 remaining');
    });

    await test.step('Go to check page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });

  test('Assert lot of original line cannot be edited for item with lot', async ({
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

    await test.step('Open edit modal for 1st item and assert lot field is disabled', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await expect(
        receivingPage.receivingStep.editModal.table.row(1).lotNumberField
          .textbox
      ).toBeDisabled();
    });
  });

  test('Assert validation on using exp date without lot for item without lot', async ({
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

    await test.step('Open edit modal for 2nd item and add exp date without lot', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .expiryDatePickerField.fillWithFormat(
          getDateByOffset(new Date(), 5),
          DateFormat.DISPLAY
        );
    });

    await test.step('Assert validation on exp date without lot', async () => {
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .expiryDatePickerField.assertHasError();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .expiryDatePickerField.textbox.hover();
      await expect(
        receivingPage.receivingStep.editModal.table
          .row(1)
          .expiryDatePickerField.tooltip.filter({
            hasText: 'Cannot enter an expiration date without a lot number',
          })
      ).toBeVisible();
      await expect(
        receivingPage.receivingStep.editModal.saveButton
      ).toBeDisabled();
    });
  });

  test('Assert validation on using exp date without lot for item with lot on splitted line', async ({
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

    await test.step('Open edit modal for 1st item and split line with exp date without lot', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.fillWithFormat(
          getDateByOffset(new Date(), 5),
          DateFormat.DISPLAY
        );
    });

    await test.step('Assert validation on exp date without lot', async () => {
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.assertHasError();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.textbox.hover();
      await expect(
        receivingPage.receivingStep.editModal.table
          .row(2)
          .expiryDatePickerField.tooltip.filter({
            hasText: 'Cannot enter an expiration date without a lot number',
          })
      ).toBeVisible();
      await expect(
        receivingPage.receivingStep.editModal.saveButton
      ).toBeDisabled();
    });
  });

  // The lot of the original line can't be changed, so a lot is added on a
  // new line, while the original line is received with 0.
  test('Add lot and exp date for item in the middle of receipt', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    const lot = uniqueIdentifier.generateUniqueString('new-lot');
    const expDate = getDateByOffset(new Date(), 5);

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal for item without lot and add line with lot and exp date', async () => {
      await receivingPage.receivingStep.table.row(2).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('0');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.fillWithFormat(expDate, DateFormat.DISPLAY);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('10');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    // item rows: replaced row (2), changes toggle row (3), new line (4)
    await test.step('Assert added lot and exp date on receive page', async () => {
      await expect(
        receivingPage.receivingStep.table.getCellValue(4, 'Lot/SN')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(4, 'Exp Date')
      ).toContainText(formatDate(expDate, DateFormat.DISPLAY));
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.numberbox
      ).toHaveValue('10');
    });

    await test.step('Go to check page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });

  test('Split line into 2 lots', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    const lot = uniqueIdentifier.generateUniqueString('new-lot');
    const expDate = getDateByOffset(new Date(), 5);

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal for item with lot and split into 2 lots', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('15');
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .lotNumberField.textbox.fill(lot);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .expiryDatePickerField.fillWithFormat(expDate, DateFormat.DISPLAY);
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('5');
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
      await receivingPage.receivingStep.isLoaded();
    });

    // item rows: replaced row (1), changes toggle row (2), original line (3),
    // new line (4)
    await test.step('Assert added lot and exp date and receiving qty on receive page', async () => {
      await expect(
        receivingPage.receivingStep.table.getCellValue(1, 'Receiving now')
      ).toHaveText('20');
      await expect(
        receivingPage.receivingStep.table.row(3).receivingNowField.numberbox
      ).toHaveValue('15');
      await expect(
        receivingPage.receivingStep.table.getCellValue(4, 'Lot/SN')
      ).toContainText(lot);
      await expect(
        receivingPage.receivingStep.table.getCellValue(4, 'Exp Date')
      ).toContainText(formatDate(expDate, DateFormat.DISPLAY));
      await expect(
        receivingPage.receivingStep.table.row(4).receivingNowField.numberbox
      ).toHaveValue('5');
    });

    await test.step('Go to check page and receive shipment', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });
});
