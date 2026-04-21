import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Assert receiving bin on create putaway page', () => {
  let PRIMARY_STOCK_MOVEMENT: StockMovementResponse;
  let SECONDARY_STOCK_MOVEMENT: StockMovementResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const lot = uniqueIdentifier.generateUniqueString('lot');

  test.beforeEach(
    async ({
      stockMovementService,
      supplierLocationService,
      productService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();

      await test.step('Create 1st stock movement', async () => {
        PRIMARY_STOCK_MOVEMENT = await stockMovementService.createInbound({
          originId: supplierLocation.id,
        });

        productService.setProduct('5');
        const product = await productService.getProduct();

        await stockMovementService.addItemsToInboundStockMovement(
          PRIMARY_STOCK_MOVEMENT.id,
          [
            {
              productId: product.id,
              quantity: 10,
              lotNumber: lot,
              expirationDate: getDateByOffset(new Date(), 3),
            },
          ]
        );

        await stockMovementService.sendInboundStockMovement(
          PRIMARY_STOCK_MOVEMENT.id,
          {
            shipmentType: ShipmentType.AIR,
          }
        );
      });

      await test.step('Receive 1st stock movement', async () => {
        const { data: stockMovement } =
          await stockMovementService.getStockMovement(
            PRIMARY_STOCK_MOVEMENT.id
          );
        const shipmentId = getShipmentId(stockMovement);
        const { data: receipt } = await receivingService.getReceipt(shipmentId);
        const receivingBin =
          AppConfig.instance.receivingBinPrefix +
          PRIMARY_STOCK_MOVEMENT.identifier;

        await receivingService.createReceivingBin(shipmentId, receipt);

        await receivingService.updateReceivingItems(shipmentId, [
          {
            shipmentItemId: getShipmentItemId(receipt, 0, 0),
            quantityReceiving: 10,
            binLocationName: receivingBin,
          },
        ]);
        await receivingService.completeReceipt(shipmentId);
      });

      await test.step('Create 2nd stock movement', async () => {
        SECONDARY_STOCK_MOVEMENT = await stockMovementService.createInbound({
          originId: supplierLocation.id,
        });

        productService.setProduct('5');
        const product = await productService.getProduct();

        await stockMovementService.addItemsToInboundStockMovement(
          SECONDARY_STOCK_MOVEMENT.id,
          [{ productId: product.id, quantity: 10 }]
        );

        await stockMovementService.sendInboundStockMovement(
          SECONDARY_STOCK_MOVEMENT.id,
          {
            shipmentType: ShipmentType.AIR,
          }
        );
      });

      await test.step('Receive 2nd stock movement', async () => {
        const { data: stockMovement } =
          await stockMovementService.getStockMovement(
            SECONDARY_STOCK_MOVEMENT.id
          );
        const shipmentId = getShipmentId(stockMovement);
        const { data: receipt } = await receivingService.getReceipt(shipmentId);
        const receivingBin2 =
          AppConfig.instance.receivingBinPrefix +
          SECONDARY_STOCK_MOVEMENT.identifier;

        await receivingService.createReceivingBin(shipmentId, receipt);

        await receivingService.updateReceivingItems(shipmentId, [
          {
            shipmentItemId: getShipmentItemId(receipt, 0, 0),
            quantityReceiving: 10,
            binLocationName: receivingBin2,
          },
        ]);
        await receivingService.completeReceipt(shipmentId);
      });
    }
  );

  test.afterEach(
    async ({
      stockMovementShowPage,
      stockMovementService,
      navbar,
      transactionListPage,
      oldViewShipmentPage,
    }) => {
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      for (let n = 1; n < 4; n++) {
        await transactionListPage.deleteTransaction(1);
      }

      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT: PRIMARY_STOCK_MOVEMENT,
      });

      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT: SECONDARY_STOCK_MOVEMENT,
      });
    }
  );

  test('Assert receiving bin on create putaway page', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    productService,
    productShowPage,
    mainLocationService,
    internalLocationService,
    putawayDetailsPage,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + PRIMARY_STOCK_MOVEMENT.identifier;
    const receivingBin2 =
      AppConfig.instance.receivingBinPrefix +
      SECONDARY_STOCK_MOVEMENT.identifier;
    productService.setProduct('5');
    const product = await productService.getProduct();
    const expDate = getDateByOffset(new Date(), 3);
    const currentLocation = await mainLocationService.getLocation();
    const internalLocation = await internalLocationService.getLocation();

    await test.step('Go to create putaway page', async () => {
      await stockMovementShowPage.goToPage(PRIMARY_STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Assert content of create putawy page', async () => {
      await expect(createPutawayPage.table.rows).toHaveCount(2);
      await expect(createPutawayPage.table.row(0).receivingBin).toContainText(
        receivingBin2
      );
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin2)
        .click();
      await expect(
        createPutawayPage.table.row(1).getProductName(product.name)
      ).toBeVisible();
      await expect(createPutawayPage.table.row(2).receivingBin).toContainText(
        receivingBin
      );
      await createPutawayPage.table
        .row(2)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(3).getProductName(product.name)
      ).toBeVisible();
      await expect(createPutawayPage.table.row(3).getLot(lot)).toBeVisible();
      await expect(
        createPutawayPage.table.row(3).getExpDate(expDate)
      ).toBeVisible();
    });

    await test.step('Assert receiving bins and lot and exp on stockcard', async () => {
      await productShowPage.goToPage(product.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(receivingBin2);
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(receivingBin);
      await expect(productShowPage.inStockTabSection.row(2).lot).toHaveText(
        lot
      );
      await expect(productShowPage.inStockTabSection.row(2).expires).toHaveText(
        formatDate(expDate, 'MMM DD, YYYY')
      );
    });

    await test.step('Open transfer stock dialog for the 1st inventory', async () => {
      await productShowPage.inStockTabSection.row(1).actionsButton.click();
      await productShowPage.inStockTabSection.stockTransferButton.click();
      await productShowPage.inStockTabSection.stockTransferDialog.isLoaded();
    });

    await test.step('Perform Stock Transfer of 1 inventory to another receiving bin', async () => {
      await productShowPage.inStockTabSection.stockTransferDialog.locationSelect.click();
      await productShowPage.inStockTabSection.stockTransferDialog.selectLocation(
        currentLocation.name
      );
      await productShowPage.inStockTabSection.stockTransferDialog.binLocationSelect.click();
      await productShowPage.inStockTabSection.stockTransferDialog.selectLocation(
        receivingBin
      );
      await productShowPage.inStockTabSection.stockTransferDialog.transferStockButton.click();
    });

    await test.step('Assert receiving bins and lot and exp on stockcard after stock transfer', async () => {
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(receivingBin);
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(receivingBin);
      await expect(productShowPage.inStockTabSection.row(2).lot).toHaveText(
        lot
      );
      await expect(productShowPage.inStockTabSection.row(2).expires).toHaveText(
        formatDate(expDate, 'MMM DD, YYYY')
      );
    });

    await test.step('Go to create putaway page', async () => {
      await productShowPage.inStockTabSection.isLoaded();
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Assert create putaway page content after stock transfer', async () => {
      await expect(createPutawayPage.table.rows).toHaveCount(1);
      await expect(createPutawayPage.table.row(0).receivingBin).toContainText(
        receivingBin
      );
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getProductName(product.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getProductName(product.name)
      ).toBeVisible();
      await expect(createPutawayPage.table.row(2).getLot(lot)).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getExpDate(expDate)
      ).toBeVisible();
      await expect(createPutawayPage.table.rows).toHaveCount(3);
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.table.row(2).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bins to putaway', async () => {
      await createPutawayPage.startStep.table.row(1).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.table.row(2).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(2)
        .getPutawayBin(internalLocation.name)
        .click();
      await expect(
        createPutawayPage.startStep.table.row(2).lotField
      ).toHaveText(lot);
      await expect(
        createPutawayPage.startStep.table.row(2).expiryDateField
      ).toHaveText(formatDate(expDate, 'MM/DD/YYYY'));
    });

    await test.step('Go to next page and complete putaway', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert bins and lot on stockcard after putaway', async () => {
      await productShowPage.goToPage(product.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(1).binLocation
      ).toHaveText(internalLocation.name);
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(internalLocation.name);
      await expect(productShowPage.inStockTabSection.row(2).lot).toHaveText(
        lot
      );
      await expect(productShowPage.inStockTabSection.row(2).expires).toHaveText(
        formatDate(expDate, 'MMM DD, YYYY')
      );
    });
  });
});
