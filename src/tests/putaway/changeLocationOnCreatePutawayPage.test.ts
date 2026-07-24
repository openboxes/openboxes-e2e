import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { StockMovementResponse } from '@/types';
import BinLocationUtils from '@/utils/BinLocationUtils';
import { cleanupPendingPutaways } from '@/utils/putawayUtils';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';

test.describe('Change location on putaway create page and list pages', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let PUTAWAY_ORDER_IDS: string[] = [];

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      productService,
      receivingService,
    }) => {
      PUTAWAY_ORDER_IDS = [];
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
    async (
      {
        stockMovementService,
        locationService,
        mainLocationService,
        putawayService,
      },
      testInfo
    ) => {
      await cleanupPendingPutaways({
        putawayService,
        putawayOrderIds: PUTAWAY_ORDER_IDS,
        testInfo,
      });

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

  test('Change location on putaway create page and list page', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    locationChooser,
    productService,
    depotLocationService,
    mainLocationService,
    putawayListPage,
    authService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);
    const mainLocation = await mainLocationService.getLocation();
    const depotLocation = await depotLocationService.getLocation();

    await test.step('Go to stock movement show page and assert received status', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Received');
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
    });

    await test.step('Go to create putaway page and assert its content', async () => {
      await createPutawayPage.goToPage();
      await createPutawayPage.isLoaded();
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
    });

    await test.step('Change location to another depot', async () => {
      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(depotLocation.organization?.name as string)
        .click();
      await locationChooser.getLocation(depotLocation.name).click();
      await RefreshCachesUtils.refreshCaches({
        navbar,
      });
      await createPutawayPage.goToPage();
      await expect(createPutawayPage.emptyCreatePageInformation).toBeVisible();
      await expect(
        createPutawayPage.table.row(0).getExpandBinLocation(receivingBin)
      ).toBeHidden();
    });

    await test.step('Return to main location and create pending putaway', async () => {
      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(mainLocation.organization?.name as string)
        .click();
      await locationChooser.getLocation(mainLocation.name).click();
      await navbar.profileButton.click();
      await navbar.refreshCachesButton.click();
      await createPutawayPage.goToPage();
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await createPutawayPage.table.row(1).checkbox.click();
      PUTAWAY_ORDER_IDS.push(await createPutawayPage.startPutaway());
      await createPutawayPage.startStep.isLoaded();
    });

    const putawayOrderIdentifier =
      await createPutawayPage.startStep.orderNumberValue.textContent();

    const putawayOrderIdentifierContent = `${putawayOrderIdentifier}`
      .toString()
      .trim();

    await test.step('Save pending putaway', async () => {
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to list page and assert putaway is created', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rowByOrderNumber(putawayOrderIdentifierContent)
          .statusTag
      ).toHaveText('Pending');
    });

    await test.step('Change location to another depot', async () => {
      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(depotLocation.organization?.name as string)
        .click();
      await locationChooser.getLocation(depotLocation.name).click();
      await putawayListPage.goToPage();
      await putawayListPage.searchField.fill(putawayOrderIdentifierContent);
      await putawayListPage.searchButton.click();
      await putawayListPage.emptyPutawayList.isVisible();
    });

    await test.step('Go to putaway list page and assert pending putaway not visible in other location', async () => {
      await putawayListPage.goToPage();
      await expect(putawayListPage.destinationFilter).toContainText(
        depotLocation.name
      );
      await putawayListPage.searchField.fill(putawayOrderIdentifierContent);
      await putawayListPage.searchButton.click();
      await putawayListPage.emptyPutawayList.isVisible();
    });

    await test.step('Return to main location', async () => {
      await authService.changeLocation(AppConfig.instance.locations.main.id);
    });
  });
});
