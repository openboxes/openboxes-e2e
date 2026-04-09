import Navbar from '@/components/Navbar';
import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import ProductShowPage from '@/pages/product/productShow/ProductShowPage';
import { StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Assert validation on qty removed from receiving bin', () => {
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
      for (let n = 1; n < 4; n++) {
        await transactionListPage.deleteTransaction(1);
      }
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Assert validation on qty removed from receiving bin', async ({
    page,
    transactionListPage,
    editTransactionPage,
    stockMovementShowPage,
    createPutawayPage,
    internalLocationService,
    productShowPage,
    putawayDetailsPage,
    productService,
    putawayListPage,
    browser,
    navbar,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    productService.setProduct('5');
    const product = await productService.getProduct();
    productService.setProduct('4');
    const product2 = await productService.getProduct();
    const internalLocation = await internalLocationService.getLocation();

    await test.step('Edit transaction date of transfer in', async () => {
      await page.goto('./dashboard');
      await navbar.configurationButton.click();
      await navbar.transactions.click();
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.editButton.click();
      await editTransactionPage.transactionDetailsHeaderTab
        .row(2)
        .transactionDateMinuteSelect.click();
      await editTransactionPage.transactionDetailsHeaderTab
        .row(2)
        .decreaseMinute();
      await editTransactionPage.saveButton.click();
    });

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
    });

    await test.step('Select bin to putaway and go to next page', async () => {
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
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
    });

    await test.step('Open new tab and edit qty to 0 in receiving bin on stock card', async () => {
      const newPage = await browser.newPage();
      const newProductShowPage = new ProductShowPage(newPage);
      const newNavbar = new Navbar(newPage);
      await newProductShowPage.goToPage(product.id);
      await newProductShowPage.recordStockButton.click();
      await newProductShowPage.recordStock.lineItemsTable
        .row(1)
        .newQuantity.getByRole('textbox')
        .fill('0');
      await newProductShowPage.recordStock.lineItemsTable.saveButton.click();
      await newNavbar.profileButton.click();
      await newNavbar.refreshCachesButton.click();
      await newPage.close();
    });

    await test.step('Try to complete putaway and assert error message', async () => {
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
      await expect(
        createPutawayPage.completeStep.validationOnQtyInReceivingBin
      ).toBeVisible();
    });

    await test.step('Go backward and assert validatiion', async () => {
      await createPutawayPage.completeStep.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await expect(createPutawayPage.startStep.saveButton).toBeDisabled();
      await expect(createPutawayPage.startStep.nextButton).toBeDisabled();
      await createPutawayPage.startStep.table.row(1).editButton.click();
      await createPutawayPage.startStep.table.row(1).quantityInput.hover();
      await createPutawayPage.startStep.table.assertValidationOnQtyField(
        'Quantity cannot be greater than original putaway item quantity'
      );
    });

    await test.step('Delete invalid line', async () => {
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(3);
      await createPutawayPage.startStep.table.row(1).deleteButton.click();
      await expect(createPutawayPage.startStep.table.rows).toHaveCount(2);
      await expect(createPutawayPage.startStep.saveButton).toBeEnabled();
      await expect(createPutawayPage.startStep.nextButton).toBeEnabled();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Edit qty to lower in receiving bin when putaway started', async () => {
      await productShowPage.goToPage(product2.id);
      await productShowPage.recordStockButton.click();
      await productShowPage.recordStock.lineItemsTable
        .row(2)
        .newQuantity.getByRole('textbox')
        .fill('5');
      await productShowPage.recordStock.lineItemsTable.saveButton.click();
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
    });

    await test.step('Go to putaway list page and edit created pending putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Edit pending putaway and assert validation on qty', async () => {
      await putawayDetailsPage.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await expect(createPutawayPage.startStep.saveButton).toBeDisabled();
      await expect(createPutawayPage.startStep.nextButton).toBeDisabled();
      await createPutawayPage.startStep.table.row(1).editButton.click();
      await createPutawayPage.startStep.table.row(1).quantityInput.hover();
      await createPutawayPage.startStep.table.assertValidationOnQtyField(
        'Quantity cannot be greater than original putaway item quantity'
      );
    });

    await test.step('Edit qty in pending putaway', async () => {
      await createPutawayPage.startStep.table.row(1).quantityInput.fill('5');
      await expect(createPutawayPage.startStep.saveButton).toBeEnabled();
      await expect(createPutawayPage.startStep.nextButton).toBeEnabled();
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('Assert putaway bin and qty on stock card', async () => {
      await productShowPage.goToPage(product2.id);
      await productShowPage.inStockTab.click();
      await productShowPage.inStockTabSection.isLoaded();
      await expect(
        productShowPage.inStockTabSection.row(2).binLocation
      ).toHaveText(internalLocation.name);
      await expect(
        productShowPage.inStockTabSection.row(2).quantityOnHand
      ).toHaveText('5');
    });
  });
});
