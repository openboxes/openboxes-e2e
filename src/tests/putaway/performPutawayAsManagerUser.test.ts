import Navbar from '@/components/Navbar';
import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import CreatePutawayPage from '@/pages/putaway/CreatePutawayPage';
import PutawayDetailsPage from '@/pages/putaway/putawayDetails/PutawayDetailsPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
import { StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Perform putaway as manager user', () => {
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

      productService.setProduct('3');
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
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      await transactionListPage.deleteTransaction(1);
      await transactionListPage.deleteTransaction(1);
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Perform putaway as manager user', async ({
    managerUserContext,
    internalLocationService,
    productService,
    page,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    productService.setProduct('3');
    const product = await productService.getProduct();
    productService.setProduct('4');
    const product2 = await productService.getProduct();
    const internalLocation = await internalLocationService.getLocation();

    const managerUserPage = await managerUserContext.newPage();
    const navbar = new Navbar(managerUserPage);
    const stockMovementShowPage = new StockMovementShowPage(managerUserPage);
    const createPutawayPage = new CreatePutawayPage(managerUserPage);
    const putawayDetailsPage = new PutawayDetailsPage(managerUserPage);

    await test.step('Go to create putaway page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await RefreshCachesUtils.refreshCaches({
        navbar,
        page,
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
        createPutawayPage.table.row(1).getProductName(product2.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getProductName(product.name)
      ).toBeVisible();
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
    });

    await test.step('Use edit button as manager user on both lines', async () => {
      await createPutawayPage.startStep.table.row(1).editButton.click();
      await createPutawayPage.startStep.table.row(1).quantityInput.fill('5');
      await createPutawayPage.startStep.table.row(2).editButton.click();
      await createPutawayPage.startStep.table.row(2).quantityInput.fill('5');
    });

    await test.step('Go to complete step and assert qty after edit', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).quantity
      ).toContainText('5');
      await expect(
        createPutawayPage.completeStep.table.row(3).quantity
      ).toContainText('5');
      await expect(createPutawayPage.completeStep.table.rows).toHaveCount(4);
    });

    await test.step('Go backward and use delete button as manager user', async () => {
      await createPutawayPage.completeStep.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(3);
      await createPutawayPage.startStep.table.row(2).deleteButton.click();
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(2);
    });

    await test.step('Go to next page and assert displayed rows', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await expect(createPutawayPage.completeStep.table.rows).toHaveCount(3);
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.completeStep.completePutawayButton.click();
      await expect(
        createPutawayPage.completeStep.confirmPutawayDialog
      ).toBeVisible();
      await expect(
        createPutawayPage.completeStep.confirmPutawayDialog
      ).toContainText(
        /Qty5 of item .* is still in the receiving bin\. Do you want to continue\?/
      );
      await expect(
        createPutawayPage.completeStep.confirmPutawayDialog
      ).toBeVisible();
      await createPutawayPage.completeStep.yesButtonOnConfirmPutawayDialog
        .last()
        .click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert qty still available to putaway on create putaway page', async () => {
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
      await createPutawayPage.goToPage();
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await expect(
        createPutawayPage.table.row(1).getProductName(product2.name)
      ).toBeVisible();
      await expect(
        createPutawayPage.table.row(2).getProductName(product.name)
      ).toBeVisible();
      await managerUserPage.close();
    });
  });
});
