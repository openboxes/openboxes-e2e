import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';

test.describe('Add comment to Putaway', () => {
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

      const product = await productService.getProduct(Product.FIVE);

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

      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT,
      });
    }
  );

  test('Add comment to putaway', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    putawayDetailsPage,
    putawayListPage,
    mainUserService,
    addCommentToPutawayPage,
    managerUserService,
  }) => {
    const internalLocation = await internalLocationService.getLocation();

    const mainUser = await mainUserService.getUser();
    const managerUser = await managerUserService.getUser();

    await test.step('Go to stock movement show page and assert received status', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
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

    await test.step('Go to putaway list page', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(putawayListPage.table.row(1).statusTag).toHaveText(
        'Pending'
      );
    });

    await test.step('Go to putaway view page', async () => {
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Add comment to pending putaway', async () => {
      await expect(putawayDetailsPage.addCommentButton).toBeVisible();
      await putawayDetailsPage.addCommentButton.click();
      await addCommentToPutawayPage.isLoaded();
      await addCommentToPutawayPage.commentField.fill('add comment');
      await addCommentToPutawayPage.saveButton.click();
    });

    await test.step('Assert comment is indicated on putaway details page', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.commentsTab.click();
      await expect(putawayDetailsPage.badgeCount).toBeVisible();
      await expect(putawayDetailsPage.badgeCount).toHaveAttribute(
        'data-count',
        '1'
      );
    });

    await test.step('Assert content of comments tab', async () => {
      await expect(
        putawayDetailsPage.commentsTable.getColumnHeader('to')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.commentsTable.getColumnHeader('from')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.commentsTable.getColumnHeader('Comment')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.commentsTable.getColumnHeader('Date')
      ).toBeVisible();
      await expect(
        putawayDetailsPage.commentsTable.getColumnHeader('Actions')
      ).toBeVisible();
    });

    await test.step('Assert content of added comment', async () => {
      await expect(
        putawayDetailsPage.commentsTable.row(2).commentContent
      ).toHaveText('add comment');
    });

    await test.step('Edit added comment', async () => {
      await putawayDetailsPage.commentsTable.row(2).editButton.click();
      await addCommentToPutawayPage.isLoaded();
      await expect(addCommentToPutawayPage.commentField).toHaveText(
        'add comment'
      );
      await addCommentToPutawayPage.commentField.fill('edit added comment');
      await addCommentToPutawayPage.saveButton.click();
    });

    await test.step('Assert comment is indicated on putaway details page', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.commentsTab.click();
      await expect(putawayDetailsPage.badgeCount).toBeVisible();
      await expect(putawayDetailsPage.badgeCount).toHaveAttribute(
        'data-count',
        '1'
      );
    });

    await test.step('Assert content of added comment', async () => {
      await expect(putawayDetailsPage.commentsTable.rows).toHaveCount(1);
      await expect(
        putawayDetailsPage.commentsTable.row(2).commentContent
      ).toHaveText('edit added comment');
    });

    await test.step('Add another comment to pending putaway', async () => {
      await expect(putawayDetailsPage.addCommentButton).toBeVisible();
      await putawayDetailsPage.addCommentButton.click();
      await addCommentToPutawayPage.isLoaded();
      await addCommentToPutawayPage.commentField.fill('add another comment');
      await addCommentToPutawayPage.saveButton.click();
    });

    await test.step('Assert comment is indicated on putaway details page', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.commentsTab.click();
      await expect(putawayDetailsPage.badgeCount).toBeVisible();
      await expect(putawayDetailsPage.badgeCount).toHaveAttribute(
        'data-count',
        '2'
      );
      await putawayDetailsPage.commentsTable.isLoaded();
      await expect(putawayDetailsPage.commentsTable.rows).toHaveCount(4);
    });

    await test.step('Delete added comment', async () => {
      await putawayDetailsPage.commentsTable.clickDeleteCommentButton(2);
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Assert delete comment is indicated on putaway details page', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.commentsTab.click();
      await expect(putawayDetailsPage.badgeCount).toBeVisible();
      await expect(putawayDetailsPage.badgeCount).toHaveAttribute(
        'data-count',
        '1'
      );
      await expect(putawayDetailsPage.commentsTable.rows).toHaveCount(3);
    });

    await test.step('Assert delete added comments', async () => {
      await putawayDetailsPage.commentsTable.clickDeleteCommentButton(2);
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.commentsTab.click();
      await expect(
        putawayDetailsPage.commentsTable.emptyCommentTable
      ).toBeVisible();
      await expect(putawayDetailsPage.badgeCount).toBeHidden();
    });

    await test.step('Return to putaway and complete it', async () => {
      await putawayDetailsPage.editButton.click();
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
      await putawayDetailsPage.isLoaded();
    });

    await test.step('Add comment to compleded putaway', async () => {
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.addCommentButton).toBeVisible();
      await putawayDetailsPage.addCommentButton.click();
      await addCommentToPutawayPage.isLoaded();
      await addCommentToPutawayPage.selectRecipient(managerUser.name);
      await expect(addCommentToPutawayPage.senderName).toContainText(
        mainUser.name
      );
      await addCommentToPutawayPage.commentField.fill(
        'add comment to completed putaway'
      );
      await addCommentToPutawayPage.saveButton.click();
    });

    await test.step('Assert comment is indicated on putaway details page', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.commentsTab.click();
      await expect(putawayDetailsPage.badgeCount).toBeVisible();
      await expect(putawayDetailsPage.badgeCount).toHaveAttribute(
        'data-count',
        '1'
      );
    });

    await test.step('Assert content of added comment', async () => {
      await expect(putawayDetailsPage.commentsTable.rows).toHaveCount(3);
      await expect(
        putawayDetailsPage.commentsTable.row(2).recipientContent
      ).toContainText(managerUser.name);
      await expect(
        putawayDetailsPage.commentsTable.row(2).senderContent
      ).toContainText(mainUser.name);
      await expect(
        putawayDetailsPage.commentsTable.row(2).commentContent
      ).toHaveText('add comment to completed putaway');
    });
  });
});
