import AppConfig from '@/config/AppConfig';
import { LOCATION_URL } from '@/constants/applicationUrls';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { ProductResponse, StockMovementResponse } from '@/types';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import {
  deleteReceivedShipment,
  getShipmentId,
  getShipmentItemId,
} from '@/utils/shipmentUtils';
import { byNameAsc } from '@/utils/sortUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Assert zones on putaway pages', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let productA: ProductResponse;
  let productB: ProductResponse;
  const uniqueIdentifier = new UniqueIdentifier();
  const zoneLocationName = uniqueIdentifier.generateUniqueString('zone');

  test.beforeEach(
    async ({
      supplierLocationService,
      mainLocationService,
      stockMovementService,
      productService,
      receivingService,
      productShowPage,
      productEditPage,
      internalLocationService,
      page,
      locationListPage,
      createLocationPage,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      const mainLocation = await mainLocationService.getLocation();
      const internalLocation = await internalLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      [productA, productB] = [
        await productService.getProduct(Product.FIVE),
        await productService.getProduct(Product.FOUR),
      ].sort(byNameAsc);

      await test.step('Create and receive stock movement', async () => {
        await stockMovementService.addItemsToInboundStockMovement(
          STOCK_MOVEMENT.id,
          [
            { productId: productA.id, quantity: 10 },
            { productId: productB.id, quantity: 10 },
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
      });

      await test.step('Create zone for location', async () => {
        await page.goto(LOCATION_URL.list());
        await locationListPage.searchByLocationNameField.fill(
          mainLocation.name
        );
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationEditButton(mainLocation.name)
        ).toBeVisible();
        await locationListPage.getLocationEditButton(mainLocation.name).click();
        await createLocationPage.zoneLocationTab.click();
        await createLocationPage.zoneLocationTabSection.isLoaded();
        await createLocationPage.zoneLocationTabSection.addZoneLocationButton.click();
        await createLocationPage.zoneLocationTabSection.addZoneLocationDialog.zoneLocationNameField.fill(
          zoneLocationName
        );
        await createLocationPage.zoneLocationTabSection.addZoneLocationDialog.saveButton.click();
        await createLocationPage.zoneLocationTabSection.isLoaded();
      });

      await test.step('Assign created zone to bin location', async () => {
        await createLocationPage.binLocationTab.click();
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.searchField.fill(
          internalLocation.name
        );
        await createLocationPage.binLocationTabSection.searchField.press(
          'Enter'
        );
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.editBinButton
          .first()
          .click();
        await createLocationPage.locationDetailsTabSection.zoneLocationSelect.click();
        await createLocationPage.locationDetailsTabSection
          .getZoneLocation(zoneLocationName)
          .click();
        await createLocationPage.locationDetailsTabSection.saveButton.click();
      });

      await test.step('Assign bin with zone as preferred bin', async () => {
        await productShowPage.goToPage(productB.id);
        await productShowPage.editProductButton.click();
        await productEditPage.inventoryLevelsTab.click();
        await productEditPage.inventoryLevelsTabSection.createStockLevelButton.click();
        await productEditPage.inventoryLevelsTabSection.createStockLevelModal.receivingTab.click();
        const internalLocation = await internalLocationService.getLocation();
        await productEditPage.inventoryLevelsTabSection.createStockLevelModal.defaultPutawayLocation.click();
        await productEditPage.inventoryLevelsTabSection.createStockLevelModal
          .getDefaultPutawayLocation(internalLocation.name)
          .click();
        await productEditPage.inventoryLevelsTabSection.createStockLevelModal.createButton.click();
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
      productService,
      productShowPage,
      productEditPage,
      page,
      locationListPage,
      mainLocationService,
      createLocationPage,
      internalLocationService,
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
        STOCK_MOVEMENT,
      });
      const product = await productService.getProduct(Product.FOUR);

      await test.step('Delete inventory level', async () => {
        await productShowPage.goToPage(product.id);
        await productShowPage.editProductButton.click();
        await productEditPage.inventoryLevelsTab.click();
        await productEditPage.inventoryLevelsTabSection
          .row(1)
          .editInventoryLevelButton.click();
        await expect(
          productEditPage.inventoryLevelsTabSection.table
        ).toBeVisible();
        await productEditPage.inventoryLevelsTabSection.createStockLevelModal.clickDeleteInventoryLevel();
      });

      await test.step('Remove zone from bin location', async () => {
        const mainLocation = await mainLocationService.getLocation();
        const internalLocation = await internalLocationService.getLocation();
        await page.goto(LOCATION_URL.list());
        await locationListPage.searchByLocationNameField.fill(
          mainLocation.name
        );
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationEditButton(mainLocation.name)
        ).toBeVisible();
        await locationListPage.getLocationEditButton(mainLocation.name).click();
        await createLocationPage.binLocationTab.click();
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.searchField.fill(
          internalLocation.name
        );
        await createLocationPage.binLocationTabSection.searchField.press(
          'Enter'
        );
        await createLocationPage.binLocationTabSection.isLoaded();
        await createLocationPage.binLocationTabSection.editBinButton
          .first()
          .click();
        await createLocationPage.locationDetailsTabSection.clearZoneLocation.click();
        await createLocationPage.locationDetailsTabSection.saveButton.click();
      });

      await test.step('Deactivate created zone location', async () => {
        await createLocationPage.zoneLocationTab.click();
        await createLocationPage.zoneLocationTabSection.isLoaded();
        await createLocationPage.zoneLocationTabSection.searchField.fill(
          zoneLocationName
        );
        await createLocationPage.zoneLocationTabSection.searchField.press(
          'Enter'
        );
        await createLocationPage.zoneLocationTabSection.isLoaded();
        await createLocationPage.zoneLocationTabSection.editZoneButton.click();
        await createLocationPage.locationConfigurationTab.click();
        await createLocationPage.locationConfigurationTabSection.activeCheckbox.uncheck();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });
    }
  );

  test('Create putaway and assert zones on putaway pages', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    internalLocationService,
    putawayDetailsPage,
  }) => {
    const receivingBin =
      AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
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

    await test.step('Start 1st putaway', async () => {
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
      await createPutawayPage.startStep.table.row(0).editButton.click();
      await createPutawayPage.startStep.table.row(0).quantityInput.fill('5');
    });

    await test.step('Assert zones on start putaway page', async () => {
      await createPutawayPage.startStep.table
        .row(1)
        .expandPutawayBinSelect.waitFor({ state: 'visible' });
      await createPutawayPage.startStep.table
        .row(1)
        .expandPutawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getZoneLocation(zoneLocationName)
        .isVisible();
      await createPutawayPage.startStep.table
        .row(1)
        .getPutawayBin(internalLocation.name)
        .click();
      await createPutawayPage.startStep.nextButton.click();
    });

    await test.step('Assert zones on confirm page', async () => {
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).putawayBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.completeStep.completePutawayButton.click();
      await expect(
        createPutawayPage.completeStep.confirmPutawayDialog
      ).toBeVisible();
      await createPutawayPage.completeStep.yesButtonOnConfirmPutawayDialog.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
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

    await test.step('Start 2nd putaway', async () => {
      await createPutawayPage.table
        .row(0)
        .getExpandBinLocation(receivingBin)
        .click();
      await createPutawayPage.table.row(1).checkbox.click();
      await createPutawayPage.table.row(2).checkbox.click();
      await createPutawayPage.startPutawayButton.click();
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('Assert zones on start putaway page', async () => {
      await expect(
        createPutawayPage.startStep.table.row(1).currentdBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await createPutawayPage.startStep.table
        .row(1)
        .expandPutawayBinSelect.waitFor({ state: 'visible' });
      await createPutawayPage.startStep.table
        .row(1)
        .expandPutawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getZoneLocation(zoneLocationName)
        .isVisible();
      await createPutawayPage.startStep.table
        .row(1)
        .getPutawayBin(internalLocation.name)
        .click();
      await expect(
        createPutawayPage.startStep.table.row(2).preferredBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await expect(
        createPutawayPage.startStep.table.row(2).putawayBinSelect
      ).toContainText(internalLocation.name);
      await createPutawayPage.startStep.table
        .row(2)
        .expandPutawayBinSelect.waitFor({ state: 'visible' });
      await createPutawayPage.startStep.table
        .row(2)
        .expandPutawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(2)
        .getZoneLocation(zoneLocationName)
        .isVisible();
      await createPutawayPage.startStep.table
        .row(2)
        .getPutawayBin(internalLocation.name)
        .click();
    });

    await test.step('Apply ordering by current bin', async () => {
      await createPutawayPage.startStep.sortButton.click();
      await expect(createPutawayPage.startStep.sortButton).toContainText(
        'Sort by current bins'
      );
      await expect(
        createPutawayPage.startStep.table.row(1).currentdBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await expect(
        createPutawayPage.startStep.table.row(2).preferredBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
    });

    await test.step('Apply ordering by preferred bin', async () => {
      await createPutawayPage.startStep.sortButton.click();
      await expect(createPutawayPage.startStep.sortButton).toContainText(
        'Sort by preferred bin'
      );
      await expect(
        createPutawayPage.startStep.table.row(2).currentdBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await expect(
        createPutawayPage.startStep.table.row(1).preferredBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
    });

    await test.step('Return to original order', async () => {
      await createPutawayPage.startStep.sortButton.click();
      await expect(createPutawayPage.startStep.sortButton).toContainText(
        'Sort by current bins'
      );
      await expect(
        createPutawayPage.startStep.table.row(1).currentdBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await expect(
        createPutawayPage.startStep.table.row(2).preferredBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
    });

    await test.step('Assert zones on split line dialog', async () => {
      await createPutawayPage.startStep.table
        .row(0)
        .splitLineButton.first()
        .click();
      await createPutawayPage.startStep.splitModal.isLoaded();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .expandPutawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(1)
        .getZoneLocation(zoneLocationName)
        .isVisible();
      await createPutawayPage.startStep.splitModal.table
        .row(1)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.addLineButton.click();
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .expandPutawayBinSelect.click();
      await createPutawayPage.startStep.table
        .row(2)
        .getZoneLocation(zoneLocationName)
        .isVisible();
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .getPutawayBin(internalLocation.name);
      await createPutawayPage.startStep.splitModal.table
        .row(2)
        .quantityField.fill('5');
      await createPutawayPage.startStep.splitModal.cancelButton.click();
      await createPutawayPage.startStep.nextButton.click();
    });

    await test.step('Assert zones on confirm page', async () => {
      await createPutawayPage.completeStep.isLoaded();
      await expect(
        createPutawayPage.completeStep.table.row(2).putawayBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await expect(
        createPutawayPage.completeStep.table.row(2).currentBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await expect(
        createPutawayPage.completeStep.table.row(3).putawayBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
      await expect(
        createPutawayPage.completeStep.table.row(3).preferredBin
      ).toContainText(`${zoneLocationName}: ${internalLocation.name}`);
    });

    await test.step('Complete putaway', async () => {
      await createPutawayPage.completeStep.completePutawayButton.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });
  });
});
