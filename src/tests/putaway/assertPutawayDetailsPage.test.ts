import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { getShipmentId, getShipmentItemId } from '@/utils/shipmentUtils';

test.describe('Assert putaway details page', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      fifthProductService,
      receivingService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await fifthProductService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 10 }]
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
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();
      await transactionListPage.table.row(1).actionsButton.click();
      await transactionListPage.table.deleteButton.click();
      await expect(transactionListPage.successMessage).toBeVisible();

      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.detailsListTable.oldViewShipmentPage.click();
      await oldViewShipmentPage.undoStatusChangeButton.click();
      await stockMovementShowPage.isLoaded();
      await stockMovementShowPage.rollbackButton.click();

      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
    }
  );

  test('Assert putaway details page', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    putawayDetailsPage,
    putawayListPage,
    page,
    mainLocationService,
  }) => {
    const internalLocation = await internalLocationService.getLocation();
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const currentLocation = await mainLocationService.getLocation();

    await test.step('Go to stock movement show page and assert received status', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
    });

    await test.step('Go to create putaway page', async () => {
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();
    });

    await test.step('Start putaway', async () => {
      await createPutawayPage.table.row(0).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Select bin to putaway', async () => {
      await createPutawayPage.startStep.table.row(0).putawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(0)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and assert default filtering', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(putawayListPage.orderTypeFilter).toContainText(
        'Putaway Order'
      );
      await expect(putawayListPage.orderTypeFilter).toBeDisabled();
      await expect(putawayListPage.statusFilter).toContainText('Pending');
      await expect(putawayListPage.statusFilter).toBeEnabled();
      await expect(putawayListPage.table.row(1).statusTag).toHaveText(
        'Pending'
      );
      await expect(putawayListPage.destinationFilter).toContainText(
        currentLocation.name
      );
    });

    await test.step('Go to putaway view page and assert page elements', async () => {
      await putawayListPage.table.row(1).actionsButton.click();
      await putawayListPage.table.viewOrderDetailsButton.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.listOrdersButton).toBeVisible();
      await expect(putawayDetailsPage.createOrderButton).toBeVisible();
      await expect(putawayDetailsPage.showOrderButton).toBeVisible();
      await expect(putawayDetailsPage.editButton).toBeVisible();
      await expect(putawayDetailsPage.addCommentButton).toBeVisible();
      await expect(putawayDetailsPage.addDocumentButton).toBeVisible();
      await expect(putawayDetailsPage.generatePutawayListButton).toBeVisible();
    });

    await test.step('Assert column headers on summary tab', async () => {
      await putawayDetailsPage.summaryTab.click();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Code')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Name')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Quantity')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('UOM')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Unit Price')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.summaryTable.getColumnHeader('Total Amount').nth(1)
      ).toBeVisible();
    });

    await test.step('Assert column headers on items status tab', async () => {
      await putawayDetailsPage.itemStatusTab.click();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Status')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Code')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Product')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Supplier code')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Unit of measure')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Quantity')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader(
          'Serial / Lot Number'
        )
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Expiration date')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Origin Bin')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.itemStatusTable.getColumnHeader('Destination Bin')
      ).toBeVisible();
    });

    await test.step('Assert content of items status table', async () => {
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).itemStatus
      ).toHaveText('PENDING');
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).originBin
      ).toHaveText(receivingBin);
      await expect(
        putawayDetailsPage.itemStatusTable.row(1).destinationBin
      ).toHaveText(internalLocation.name);
    });

    await test.step('Assert informations on order header', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(
        putawayDetailsPage.orderHeaderTable.statusRowValue
      ).toContainText('Pending');
      await expect(
        putawayDetailsPage.orderHeaderTable.orderTypeValue
      ).toContainText('Putaway Order');
    });

    await test.step('Assert options on summary action menu', async () => {
      await putawayDetailsPage.summaryActionsButton.click();
      await expect(
        putawayDetailsPage.actionsViewOrderDetailsButton
      ).toBeVisible();
      await expect(putawayDetailsPage.actionsAddCommentButton).toBeVisible();
      await expect(putawayDetailsPage.actionsAddDocumentsButton).toBeVisible();
      await expect(
        putawayDetailsPage.actionsGeneratePutawayListButton
      ).toBeVisible();
      await expect(putawayDetailsPage.actionsDeleteButton).toBeVisible();
      await putawayDetailsPage.summaryActionsButton.click();
    });

    const putawayOrderIdentifier =
      await putawayDetailsPage.orderHeaderTable.orderNumberValue.textContent();

    await test.step('Download putaway pdf', async () => {
      const generatePutawayPdfFileName =
        'Putaway ' + `${putawayOrderIdentifier}`.toString().trim() + '.pdf';
      await putawayDetailsPage.generatePutawayListButton.click();
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      await expect(download.suggestedFilename()).toBe(
        generatePutawayPdfFileName
      );
    });

    await test.step('Edit pending putaway and reload without losing data', async () => {
      await putawayDetailsPage.editButton.click();
      await createPutawayPage.startStep.isLoaded();
      await page.reload();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
    });

    await test.step('Assert completing putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
      await expect(
        putawayDetailsPage.orderHeaderTable.statusRowValue
      ).toContainText('Completed');
    });

    await test.step('Assert completed putaway on list putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.clearFilteringButton.click();
      await expect(putawayListPage.destinationFilter).toContainText(
        currentLocation.name
      );
      await putawayListPage.searchField.fill(
        `${putawayOrderIdentifier}`.toString().trim()
      );
      await putawayListPage.searchButton.click();
      await expect(putawayListPage.table.row(1).statusTag).toHaveText(
        'Completed'
      );
    });
  });
});
