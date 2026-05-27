import Navbar from '@/components/Navbar';
import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import CreatePutawayPage from '@/pages/putaway/CreatePutawayPage';
import PutawayListPage from '@/pages/putaway/list/PutawayListPage';
import PutawayDetailsPage from '@/pages/putaway/putawayDetails/PutawayDetailsPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
import { StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';

test.describe('Delete pending putaways', () => {
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
      oldViewShipmentPage,
    }) => {
      await deleteReceivedShipment({
        stockMovementShowPage,
        oldViewShipmentPage,
        stockMovementService,
        STOCK_MOVEMENT,
      });
    }
  );

  test('Delete pending putaway as superuser from list page', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    productService,
    putawayListPage,
    page,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and delete pending putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({ has: page.locator('td') })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await putawayListPage.table.clickDeleteOrderButton(1);
      await putawayListPage.emptyPutawayList.isVisible();
    });
  });

  test('Delete pending putaway as superuser from putaway details page', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    putawayDetailsPage,
    productService,
    putawayListPage,
    page,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway details page', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({ has: page.locator('td') })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
    });

    await test.step('Delete putaway from details page and assert is deleted', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.summaryActionsButton.click();
      await putawayDetailsPage.clickDeleteOrderButton();
      await putawayListPage.isLoaded();
      await putawayListPage.emptyPutawayList.isVisible();
    });
  });

  test('Delete pending putaway as manager user from list page', async ({
    managerUserContext,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

    const managerUserPage = await managerUserContext.newPage();
    const navbar = new Navbar(managerUserPage);
    const stockMovementShowPage = new StockMovementShowPage(managerUserPage);
    const createPutawayPage = new CreatePutawayPage(managerUserPage);
    const putawayListPage = new PutawayListPage(managerUserPage);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and delete pending putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({
          has: managerUserPage.locator('td'),
        })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await putawayListPage.table.clickDeleteOrderButton(1);
      await putawayListPage.emptyPutawayList.isVisible();
      await managerUserPage.close();
    });
  });

  test('Delete pending putaway as manager user from details page', async ({
    managerUserContext,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

    const managerUserPage = await managerUserContext.newPage();
    const navbar = new Navbar(managerUserPage);
    const stockMovementShowPage = new StockMovementShowPage(managerUserPage);
    const createPutawayPage = new CreatePutawayPage(managerUserPage);
    const putawayListPage = new PutawayListPage(managerUserPage);
    const putawayDetailsPage = new PutawayDetailsPage(managerUserPage);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway details page', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({
          has: managerUserPage.locator('td'),
        })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
    });

    await test.step('Delete putaway from details page and assert is deleted', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.summaryActionsButton.click();
      await putawayDetailsPage.clickDeleteOrderButton();
      await putawayListPage.isLoaded();
      await putawayListPage.emptyPutawayList.isVisible();
      await managerUserPage.close();
    });
  });

  test('Delete pending putaway as admin user from list page', async ({
    altUserContext,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

    const adminUserPage = await altUserContext.newPage();
    const navbar = new Navbar(adminUserPage);
    const stockMovementShowPage = new StockMovementShowPage(adminUserPage);
    const createPutawayPage = new CreatePutawayPage(adminUserPage);
    const putawayListPage = new PutawayListPage(adminUserPage);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and delete pending putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({
          has: adminUserPage.locator('td'),
        })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await putawayListPage.table.clickDeleteOrderButton(1);
      await putawayListPage.emptyPutawayList.isVisible();
      await adminUserPage.close();
    });
  });

  test('Delete pending putaway as admin user from details page', async ({
    altUserContext,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

    const adminUserPage = await altUserContext.newPage();
    const navbar = new Navbar(adminUserPage);
    const stockMovementShowPage = new StockMovementShowPage(adminUserPage);
    const createPutawayPage = new CreatePutawayPage(adminUserPage);
    const putawayListPage = new PutawayListPage(adminUserPage);
    const putawayDetailsPage = new PutawayDetailsPage(adminUserPage);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway details page', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({
          has: adminUserPage.locator('td'),
        })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
    });

    await test.step('Delete putaway from details page and assert is deleted', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.summaryActionsButton.click();
      await putawayDetailsPage.clickDeleteOrderButton();
      await putawayListPage.isLoaded();
      await putawayListPage.emptyPutawayList.isVisible();
      await adminUserPage.close();
    });
  });

  test('Delete pending putaway as assistant user from list page', async ({
    assistantUserContext,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

    const assistantUserPage = await assistantUserContext.newPage();
    const navbar = new Navbar(assistantUserPage);
    const stockMovementShowPage = new StockMovementShowPage(assistantUserPage);
    const createPutawayPage = new CreatePutawayPage(assistantUserPage);
    const putawayListPage = new PutawayListPage(assistantUserPage);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway list page and delete pending putaway', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({
          has: assistantUserPage.locator('td'),
        })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await putawayListPage.table.clickDeleteOrderButton(1);
      await putawayListPage.emptyPutawayList.isVisible();
      await assistantUserPage.close();
    });
  });

  test('Delete pending putaway as assistant user from details page', async ({
    assistantUserContext,
    productService,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
    const product = await productService.getProduct(Product.FIVE);

    const assistantUserPage = await assistantUserContext.newPage();
    const navbar = new Navbar(assistantUserPage);
    const stockMovementShowPage = new StockMovementShowPage(assistantUserPage);
    const createPutawayPage = new CreatePutawayPage(assistantUserPage);
    const putawayListPage = new PutawayListPage(assistantUserPage);
    const putawayDetailsPage = new PutawayDetailsPage(assistantUserPage);

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
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.saveButton.click();
    });

    await test.step('Go to putaway details page', async () => {
      await putawayListPage.goToPage();
      await putawayListPage.isLoaded();
      await expect(
        putawayListPage.table.rows.filter({
          has: assistantUserPage.locator('td'),
        })
      ).toHaveCount(1);
      const row = putawayListPage.table.row(1);
      await row.actionsButton.click();
      await row.viewOrderDetails.click();
    });

    await test.step('Delete putaway from details page and assert is deleted', async () => {
      await putawayDetailsPage.isLoaded();
      await putawayDetailsPage.summaryActionsButton.click();
      await putawayDetailsPage.clickDeleteOrderButton();
      await putawayListPage.isLoaded();
      await putawayListPage.emptyPutawayList.isVisible();
      await assistantUserPage.close();
    });
  });
});
