import { ReceiptStatus } from '@/constants/ReceiptStatus';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';

test.describe('Filter by "Pending" status', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(async ({ supplierLocationService, stockMovementService }) => {
    const supplierLocation = await supplierLocationService.getLocation();
    STOCK_MOVEMENT = await stockMovementService.createInbound({
      originId: supplierLocation.id,
    });
  });

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Only "Pending" stock movements should be visible in the table', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by Receipt status "Pending"', async () => {
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(ReceiptStatus.PENDING)
        .click();
      await inboundListPage.search();
    });

    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT.identifier
    );

    const statusColumnValues =
      await inboundListPage.table.allStatusColumnCells.allTextContents();
    const filteredEmptyValues = statusColumnValues.filter((it) => !!it.trim());

    expect(filteredEmptyValues).toEqual(
      Array(filteredEmptyValues.length).fill(ReceiptStatus.PENDING)
    );
  });
});

test.describe('Filter by "Shipped" status', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await mainProductService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 2 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Only "Shipped" stock movements should be visible in the table', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by Receipt status "Shipped"', async () => {
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(ReceiptStatus.SHIPPED)
        .click();
      await inboundListPage.search();
    });

    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT.identifier
    );

    const statusColumnValues =
      await inboundListPage.table.allStatusColumnCells.allTextContents();
    const filteredEmptyValues = statusColumnValues.filter((it) => !!it.trim());

    expect(filteredEmptyValues).toEqual(
      Array(filteredEmptyValues.length).fill(ReceiptStatus.SHIPPED)
    );
  });
});

test.describe('Filter by "Received" status', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      stockMovementShowPage,
      receivingPage,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await mainProductService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 2 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });

      await test.step('Go to stock movement show page', async () => {
        await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Go to shipment receiving page', async () => {
        await stockMovementShowPage.receiveButton.click();
        await receivingPage.receivingStep.isLoaded();
      });

      await test.step('Select all items to receiv', async () => {
        await receivingPage.receivingStep.table
          .row(1)
          .receivingNowField.textbox.fill('2');
      });

      await test.step('Go to Check page', async () => {
        await receivingPage.nextButton.click();
      });

      await test.step('Receive shipment', async () => {
        await receivingPage.checkStep.isLoaded();
        await receivingPage.checkStep.receiveShipmentButton.click();
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    await stockMovementShowPage.rollbackLastReceiptButton.click();
    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Only "Received" stock movements should be visible in the table', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by Receipt status "Received"', async () => {
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(ReceiptStatus.RECEIVED)
        .click();
      await inboundListPage.search();
    });

    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT.identifier
    );

    const statusColumnValues =
      await inboundListPage.table.allStatusColumnCells.allTextContents();
    const filteredEmptyValues = statusColumnValues.filter((it) => !!it.trim());

    expect(filteredEmptyValues).toEqual(
      Array(filteredEmptyValues.length).fill(ReceiptStatus.RECEIVED)
    );
  });
});

test.describe('Filter by "Receiving" status', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
      otherProductService,
      stockMovementShowPage,
      receivingPage,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await mainProductService.getProduct();
      const productTwo = await otherProductService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: product.id, quantity: 2 },
          { productId: productTwo.id, quantity: 2 },
        ]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });

      await test.step('Go to stock movement show page', async () => {
        await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Go to shipment receiving page', async () => {
        await stockMovementShowPage.receiveButton.click();
        await receivingPage.receivingStep.isLoaded();
      });

      await test.step('Select all items to receiv', async () => {
        await receivingPage.receivingStep.table
          .row(1)
          .receivingNowField.textbox.fill('2');
      });

      await test.step('Go to Check page', async () => {
        await receivingPage.nextButton.click();
      });

      await test.step('Receive shipment', async () => {
        await receivingPage.checkStep.isLoaded();
        await receivingPage.checkStep.receiveShipmentButton.click();
      });
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    await stockMovementShowPage.rollbackLastReceiptButton.click();
    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Only "Receiving" stock movements should be visible in the table', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by Receipt status "Receiving"', async () => {
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(ReceiptStatus.RECEIVING)
        .click();
      await inboundListPage.search();
    });

    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT.identifier
    );

    const statusColumnValues =
      await inboundListPage.table.allStatusColumnCells.allTextContents();
    const filteredEmptyValues = statusColumnValues.filter((it) => !!it.trim());

    expect(filteredEmptyValues).toEqual(
      Array(filteredEmptyValues.length).fill(ReceiptStatus.RECEIVING)
    );
  });
});

test.describe('Filter by multiple statuses - "Pending" and "Shipped"', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let STOCK_MOVEMENT_TWO: StockMovementResponse;

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      mainProductService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      STOCK_MOVEMENT_TWO = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      const product = await mainProductService.getProduct();

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT_TWO.id,
        [{ productId: product.id, quantity: 2 }]
      );

      await stockMovementService.sendInboundStockMovement(
        STOCK_MOVEMENT_TWO.id,
        {
          shipmentType: ShipmentType.AIR,
        }
      );
    }
  );

  test.afterEach(async ({ stockMovementService, stockMovementShowPage }) => {
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

    await stockMovementShowPage.goToPage(STOCK_MOVEMENT_TWO.id);
    await stockMovementShowPage.rollbackButton.click();

    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT_TWO.id);
  });

  test('Only "Shipped" and "Pending" stock movements should be visible in the table', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Select Receipt statuses "Pending" and "Shipped"', async () => {
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(ReceiptStatus.PENDING)
        .click();

      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(ReceiptStatus.SHIPPED)
        .click();
    });

    await test.step('Search by provided receipt statuses', async () => {
      await inboundListPage.search();
    });

    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT.identifier
    );
    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT_TWO.identifier
    );
  });
});
