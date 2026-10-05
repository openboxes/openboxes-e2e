import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { deleteShipment } from '@/utils/shipmentUtils';

test.describe('Assert bin location not clearable', () => {
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
    async ({ stockMovementService, locationService, mainLocationService }) => {
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

  test('Assert bin location not clearable', async ({
    stockMovementShowPage,
    receivingPage,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go to shipment receiving page', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Show putaway location column', async () => {
      await receivingPage.receivingStep.enableShowPutaway();
    });

    await test.step('Assert bin location cant be cleared', async () => {
      const binLocationSelect =
        receivingPage.receivingStep.table.row(1).binLocationSelect;
      await expect(binLocationSelect).toHaveText(receivingBin);
      await expect(
        binLocationSelect.locator('.react-select__clear-indicator')
      ).toBeHidden();
    });

    await test.step('Split lines', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await receivingPage.receivingStep.editModal.isLoaded();
      await receivingPage.receivingStep.editModal.addLineButton.click();
      await receivingPage.receivingStep.editModal.table
        .row(1)
        .receivingNowField.numberbox.fill('5');
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .lotNumberField.textbox.fill('E2E-split-lot');
      await receivingPage.receivingStep.editModal.table
        .row(2)
        .receivingNowField.numberbox.fill('5');
    });

    await test.step('Assert bin location field content in edit modal', async () => {
      for (const row of [1, 2]) {
        const binLocationSelect =
          receivingPage.receivingStep.editModal.table.row(
            row
          ).binLocationSelect;
        await expect(binLocationSelect).toHaveText(receivingBin);
        await expect(
          binLocationSelect.locator('.react-select__clear-indicator')
        ).toBeHidden();
      }
    });

    await test.step('Save split lines', async () => {
      await receivingPage.receivingStep.editModal.saveButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
    });

    await test.step('Assert bin location field content after split line', async () => {
      // After a split, the table shows the replaced row (1), the changes
      // toggle row (2) and the split lines (3 and 4)
      await expect(
        receivingPage.receivingStep.table.row(1).binLocationSelect
      ).toHaveText(receivingBin);
      for (const row of [3, 4]) {
        const binLocationSelect =
          receivingPage.receivingStep.table.row(row).binLocationSelect;
        await expect(binLocationSelect).toHaveText(receivingBin);
        await expect(
          binLocationSelect.locator('.react-select__clear-indicator')
        ).toBeHidden();
      }
    });
  });
});
