import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { deleteShipment } from '@/utils/shipmentUtils';

test.describe('Assert recipient field when receive', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let PRODUCT_FOUR_CODE: string;
  let PRODUCT_FIVE_CODE: string;
  let USER_NAME: string;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      mainUserService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const PRODUCT_FOUR = await productService.getProduct(Product.FOUR);
      const PRODUCT_FIVE = await productService.getProduct(Product.FIVE);
      const USER = await mainUserService.getUser();
      PRODUCT_FOUR_CODE = PRODUCT_FOUR.productCode;
      PRODUCT_FIVE_CODE = PRODUCT_FIVE.productCode;
      USER_NAME = USER.name;

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: PRODUCT_FOUR.id,
            quantity: 10,
            recipientId: USER.id,
          },
          {
            productId: PRODUCT_FIVE.id,
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

  test('Assert recipient field filled and read-only', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    // the recipient is shown as plain text in the receiving table, it can be
    // changed only in the edit modal
    const assertRecipientsOnReceivingStep = async () => {
      const table = receivingPage.receivingStep.table;
      await expect(
        table.rowByProductCode(PRODUCT_FOUR_CODE).recipient
      ).toHaveText(USER_NAME);
      await expect(
        table.rowByProductCode(PRODUCT_FIVE_CODE).recipient
      ).toBeEmpty();
      await expect(
        table
          .rowByProductCode(PRODUCT_FOUR_CODE)
          .recipient.getByTestId('custom-select-element')
      ).toBeHidden();
    };

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Assert recipient field on receiving step', async () => {
      await receivingPage.assertColumnHeaderIsVisibleOnReceivingStep(
        'Recipient'
      );
      await assertRecipientsOnReceivingStep();
    });

    await test.step('Fill partial qty for items', async () => {
      await receivingPage.receivingStep.table
        .rowByProductCode(PRODUCT_FOUR_CODE)
        .receivingNowField.numberbox.fill('5');
      await receivingPage.receivingStep.table
        .rowByProductCode(PRODUCT_FIVE_CODE)
        .receivingNowField.numberbox.fill('5');
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
    });

    await test.step('Assert recipient field on check step', async () => {
      await expect(
        receivingPage.checkStep.table.rowByProductCode(PRODUCT_FOUR_CODE)
          .recipient
      ).toHaveText(USER_NAME);
      await expect(
        receivingPage.checkStep.table.rowByProductCode(PRODUCT_FIVE_CODE)
          .recipient
      ).toBeEmpty();
    });

    await test.step('Go backward and assert recipient field', async () => {
      await receivingPage.checkStep.backToEditButton.click();
      await receivingPage.receivingStep.isLoaded();
      await assertRecipientsOnReceivingStep();
    });

    await test.step('Finish 1st receipt', async () => {
      await receivingPage.nextButton.click();
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Start 2nd receipt and assert recipient field', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
      await assertRecipientsOnReceivingStep();
    });
  });
});
