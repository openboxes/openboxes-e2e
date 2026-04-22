import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';

test.describe('Delete items from putaway', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      productService.setProduct('5');
      const product = await productService.getProduct();
      productService.setProduct('4');
      const product2 = await productService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: product.id, quantity: 10 },
          { productId: product2.id, quantity: 10 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });

      const { data: stockMovement } =
        await stockMovementService.getStockMovement(STOCK_MOVEMENT.id);
      const shipmentId = getShipmentId(stockMovement);
      const { data: receipt } = await receivingService.getReceipt(shipmentId);
      const receivingBin =
        AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;

      await receivingService.createReceivingBin(shipmentId, receipt);

      await receivingService.updateReceivingItems(shipmentId, [
        {
          shipmentItemId: getShipmentItemId(receipt, 0, 0),
          quantityReceiving: 10,
          binLocationName: receivingBin,
        },
        {
          shipmentItemId: getShipmentItemId(receipt, 0, 1),
          quantityReceiving: 10,
          binLocationName: receivingBin,
        },
      ]);
      await receivingService.completeReceipt(shipmentId);
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
      for (let n = 1; n < 3; n++) {
        await transactionListPage.deleteTransaction(1);
      }
      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT,
      });
    }
  );

  test('Delete item from putaway and assert putaway details page', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    putawayDetailsPage,
    productService,
    putawayListPage,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    productService.setProduct('5');
    const product = await productService.getProduct();
    productService.setProduct('4');
    const product2 = await productService.getProduct();
    const internalLocation = await internalLocationService.getLocation();

    await test.step('Go to create putaway page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getProductName(product.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getProductName(product2.name)
      ).toBeVisible();
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.table.row(2).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and assert number of lines', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(putawayListPage.table.row(1).lineItems).toContainText('2');
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Assert number of lines on summary tab', async () => {
      await putawayDetailsPage.summaryTab.click();
      await expect(putawayDetailsPage.summaryTable.orderItemRows).toHaveCount(
        2
      );
    });

    await test.step('Assert number of lines on status table', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.orderItemRows
      ).toHaveCount(2);
    });

    await test.step('Assert number of lines on item details table', async () => {
      await putawayDetailsPage.itemDetailsTab.click();
      await expect(
        putawayDetailsPage.itemDetailsTable.orderItemRows
      ).toHaveCount(2);
    });

    await test.step('Delete line from putaway', async () => {
      await putawayDetailsPage.editButton.click();
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(3);
      await createPutawayPage.startStep.table.row(2).deleteButton.click();
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(2);
    });

    await test.step('Select bin to putaway and save progress', async () => {
      await createPutawayPage.startStep.table.row(1).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and assert number of lines', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(putawayListPage.table.row(1).lineItems).toContainText('1');
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Assert number of lines on summary tab', async () => {
      await putawayDetailsPage.summaryTab.click();
      await expect(putawayDetailsPage.summaryTable.orderItemRows).toHaveCount(
        1
      );
    });

    await test.step('Assert number of lines on items status table', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.orderItemRows
      ).toHaveCount(1);
    });

    await test.step('Assert number of lines on item details table', async () => {
      await putawayDetailsPage.itemDetailsTab.click();
      await expect(
        putawayDetailsPage.itemDetailsTable.orderItemRows
      ).toHaveCount(1);
    });

    await test.step('Edit pending putaway', async () => {
      await putawayDetailsPage.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await expect(
        createPutawayPage.startStep.table.row(1).putawayBinSelect
      ).toHaveText(internalLocation.name);
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(2);
    });

    await test.step('Split line in putaway', async () => {
      await createPutawayPage.startStep.table.row(1).splitLineButton.click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.saveButton.click();
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(2);
    });

    await test.step('Assert split line on start step', async () => {
      await expect(
        createPutawayPage.startStep.table.row(0).splitLineInPutawayBin
      ).toHaveText('Split line');
    });

    await test.step('Go to next page and assert split line on complete step', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).putawayBin
      ).toContainText(internalLocation.name);
      await expect(
        createPutawayPage.completeStep.table.row(3).putawayBin
      ).toContainText(internalLocation.name);
      await expect(createPutawayPage.completeStep.table.rows).toHaveCount(4);
    });

    await test.step('Go to putaway list page and assert number of lines', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(putawayListPage.table.row(1).lineItems).toContainText('2');
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Assert number of lines on summary tab', async () => {
      await putawayDetailsPage.summaryTab.click();
      await expect(putawayDetailsPage.summaryTable.orderItemRows).toHaveCount(
        2
      );
    });

    await test.step('Assert number of lines on items status table', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.orderItemRows
      ).toHaveCount(2);
    });

    await test.step('Assert number of lines on item details table', async () => {
      await putawayDetailsPage.itemDetailsTab.click();
      await expect(
        putawayDetailsPage.itemDetailsTable.orderItemRows
      ).toHaveCount(2);
    });

    await test.step('Edit pending putaway and assert split line', async () => {
      await putawayDetailsPage.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await expect(
        createPutawayPage.startStep.table.row(0).splitLineInPutawayBin
      ).toHaveText('Split line');
    });

    await test.step('Go to next page and assert split line on complete step', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).putawayBin
      ).toContainText(internalLocation.name);
      await expect(
        createPutawayPage.completeStep.table.row(3).putawayBin
      ).toContainText(internalLocation.name);
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert number of lines on summary tab on completed putaway', async () => {
      await putawayDetailsPage.summaryTab.click();
      await expect(putawayDetailsPage.summaryTable.orderItemRows).toHaveCount(
        2
      );
    });

    await test.step('Assert number of lines on items status table on completed putaway', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.orderItemRows
      ).toHaveCount(2);
    });

    await test.step('Assert number of lines on item details table on completed putaway', async () => {
      await putawayDetailsPage.itemDetailsTab.click();
      await expect(
        putawayDetailsPage.itemDetailsTable.orderItemRows
      ).toHaveCount(2);
    });

    const putawayOrderIdentifier =
      await putawayDetailsPage.orderHeaderTable.orderNumberValue.textContent();

    await test.step('Assert completed putaway on list putaway and assert number of lines', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.clearFilteringButton.click();
      await putawayListPage.searchField.fill(
        `${putawayOrderIdentifier}`.toString().trim()
      );
      await putawayListPage.searchButton.click();
      await expect(putawayListPage.table.row(1).statusTag).toHaveText(
        'Completed'
      );
      await expect(putawayListPage.table.row(1).lineItems).toContainText('2');
    });
  });
});
