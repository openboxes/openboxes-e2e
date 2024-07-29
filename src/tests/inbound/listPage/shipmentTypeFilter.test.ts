import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Shipment type filter', () => {
  const SHIPMENT_TYPES = [
    ShipmentType.AIR,
    ShipmentType.LAND,
    ShipmentType.SEA,
    ShipmentType.SUITCASE,
    ShipmentType.DEFAULT,
  ];

  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({ supplierLocation, mainProduct, stockMovementService }) => {
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocationLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 2 }]
      );
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  for (const shipmentType of SHIPMENT_TYPES) {
    test(`Only stock movements of Shipment Type "${shipmentType}" should be visible`, async ({
      stockMovementService,
      inboundListPage,
      page,
    }) => {
      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: shipmentType,
      });

      await test.step('Go to inbound list page', async () => {
        await inboundListPage.goToPage();
      });

      await test.step(`Filter by shipment stype "${shipmentType}"`, async () => {
        await inboundListPage.filters.shipmentTypeSelect.click();
        await inboundListPage.filters.shipmentTypeSelect
          .getSelectOption(shipmentType)
          .click();
        await inboundListPage.filters.searchButton.click();
        await inboundListPage.waitForResponse();
      });

      await test.step(`Assert that stock movement is visible for filter by "${shipmentType}" shipment tpe`, async () => {
        await expect(
          inboundListPage.table.rows.filter({
            hasText: STOCK_MOVEMENT.identifier,
          })
        ).toBeVisible();
        await inboundListPage.table.rows
          .getByRole('link', { name: STOCK_MOVEMENT.identifier })
          .hover();
        await expect(page.getByRole('tooltip')).toContainText(shipmentType);
      });

      const OTHER_SHIPMENT_TYPES = SHIPMENT_TYPES.filter(
        (it) => it !== shipmentType
      );

      for (const otherShipmentType of OTHER_SHIPMENT_TYPES) {
        await test.step(`Filter by shipment stype "${otherShipmentType}"`, async () => {
          await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
          await inboundListPage.filters.shipmentTypeSelect.click();
          await inboundListPage.filters.shipmentTypeSelect
            .getSelectOption(otherShipmentType)
            .click();
          await inboundListPage.filters.searchButton.click();
          await inboundListPage.waitForResponse();
        });

        await test.step(`Assert that stock movement is not visible when filtering by "${otherShipmentType}"`, async () => {
          await expect(
            inboundListPage.table.rows.filter({
              hasText: STOCK_MOVEMENT.identifier,
            })
          ).toBeHidden();
        });
      }
    });
  }
});

test.describe('Multiple shipment types', () => {
  let STOCK_MOVEMENT_LAND: StockMovementResponse;
  let STOCK_MOVEMENT_SEA: StockMovementResponse;

  test.beforeEach(
    async ({ supplierLocation, mainProduct, stockMovementService }) => {
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();

      STOCK_MOVEMENT_LAND = await stockMovementService.createInbound({
        originId: supplierLocationLocation.id,
      });
      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT_LAND.id,
        [{ productId: product.id, quantity: 2 }]
      );
      await stockMovementService.sendInboundStockMovement(
        STOCK_MOVEMENT_LAND.id,
        {
          shipmentType: ShipmentType.LAND,
        }
      );

      STOCK_MOVEMENT_SEA = await stockMovementService.createInbound({
        originId: supplierLocationLocation.id,
      });
      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT_SEA.id,
        [{ productId: product.id, quantity: 2 }]
      );
      await stockMovementService.sendInboundStockMovement(
        STOCK_MOVEMENT_SEA.id,
        {
          shipmentType: ShipmentType.SEA,
        }
      );
    }
  );

  test.afterEach(async ({ stockMovementService, stockMovementShowPage }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT_LAND.id);
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT_LAND.id);

    await stockMovementShowPage.goToPage(STOCK_MOVEMENT_SEA.id);
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT_SEA.id);
  });

  test('Multiple Shipment Type "Land" & "Sea"', async ({
    inboundListPage,
    page,
  }) => {
    await inboundListPage.goToPage();

    await inboundListPage.filters.shipmentTypeSelect.click();
    await inboundListPage.filters.shipmentTypeSelect
      .getSelectOption('Default')
      .click();
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();

    await expect(
      inboundListPage.table.rows.filter({
        hasText: STOCK_MOVEMENT_LAND.identifier,
      })
    ).toBeHidden();
    await expect(
      inboundListPage.table.rows.filter({
        hasText: STOCK_MOVEMENT_SEA.identifier,
      })
    ).toBeHidden();

    await inboundListPage.filters.clearButton.click();
    await inboundListPage.waitForResponse();

    await inboundListPage.filters.shipmentTypeSelect.click();
    await inboundListPage.filters.shipmentTypeSelect
      .getSelectOption('Land')
      .click();
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();

    await expect(
      inboundListPage.table.rows.filter({
        hasText: STOCK_MOVEMENT_LAND.identifier,
      })
    ).toBeVisible();
    await inboundListPage.table.rows
      .getByRole('link', { name: STOCK_MOVEMENT_LAND.identifier })
      .hover();
    await expect(page.getByRole('tooltip')).toContainText('Land');
    await expect(
      inboundListPage.table.rows.filter({
        hasText: STOCK_MOVEMENT_SEA.identifier,
      })
    ).toBeHidden();

    await inboundListPage.filters.shipmentTypeSelect.click();
    await inboundListPage.filters.shipmentTypeSelect
      .getSelectOption('Sea')
      .click();
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();

    await expect(
      inboundListPage.table.rows.filter({
        hasText: STOCK_MOVEMENT_LAND.identifier,
      })
    ).toBeVisible();
    await inboundListPage.table.rows
      .getByRole('link', { name: STOCK_MOVEMENT_LAND.identifier })
      .hover();
    await expect(page.getByRole('tooltip')).toContainText('Land');

    await expect(
      inboundListPage.table.rows.filter({
        hasText: STOCK_MOVEMENT_SEA.identifier,
      })
    ).toBeVisible();
    await inboundListPage.table.rows
      .getByRole('link', { name: STOCK_MOVEMENT_SEA.identifier })
      .hover();
    await expect(page.getByRole('tooltip')).toContainText('Sea');
  });
});
