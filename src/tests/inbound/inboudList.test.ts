/* eslint-disable playwright/expect-expect */
import GenericService from '@/api/GenericService';
import StockMovementService from '@/api/StockMovementService';
import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate } from '@/utils/DateUtils';
import LocationData from '@/utils/LocationData';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Inbond Stock Movement list page', () => {
  const uniqueIdentifier = new UniqueIdentifier();

  test.describe('Search filter', () => {
    let STOCK_MOVEMENT: StockMovementResponse;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const stockMovementService = new StockMovementService(page.request);
      const genericService = new GenericService(page.request);
      const mainLocation = new LocationData('main', page.request);
      const supplierLocation = new LocationData('supplier', page.request);

      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const { data } = await stockMovementService.createStockMovement({
        description: uniqueIdentifier.generateUniqueString('SM'),
        destination: { id: mainLocationLocation.id },
        origin: { id: supplierLocationLocation.id },
        requestedBy: { id: user.id },
        dateRequested: formatDate(new Date()),
      });
      STOCK_MOVEMENT = data;
      await page.close();
    });

    test('Search stock movement by identifier', async ({ inboundListPage }) => {
      await inboundListPage.goToPage();

      await inboundListPage.filters.searchField.textbox.fill(
        STOCK_MOVEMENT.identifier
      );
      await inboundListPage.filters.searchButton.click();

      await expect(inboundListPage.table.row(1).identifier).toContainText(
        STOCK_MOVEMENT.identifier
      );
      await expect(inboundListPage.table.row(1).name).toContainText(
        STOCK_MOVEMENT.description
      );
      await inboundListPage.table.row(2).assertIsEmpty();
      await inboundListPage.table.row(3).assertIsEmpty();
      await inboundListPage.table.row(4).assertIsEmpty();
    });

    test('Execute search filter by pressing Enter key', async ({
      page,
      inboundListPage,
    }) => {
      await inboundListPage.goToPage();
      await inboundListPage.filters.searchField.textbox.fill(
        STOCK_MOVEMENT.identifier
      );
      await page.keyboard.press('Enter');

      await expect(inboundListPage.table.row(1).identifier).toContainText(
        STOCK_MOVEMENT.identifier
      );
      await expect(inboundListPage.table.row(1).name).toContainText(
        STOCK_MOVEMENT.description
      );
      await inboundListPage.table.row(2).assertIsEmpty();
      await inboundListPage.table.row(3).assertIsEmpty();
      await inboundListPage.table.row(4).assertIsEmpty();
    });

    test('Use clear button to clear search filter', async ({
      inboundListPage,
    }) => {
      await inboundListPage.goToPage();
      await inboundListPage.filters.searchField.textbox.fill(
        STOCK_MOVEMENT.identifier
      );
      await inboundListPage.filters.searchButton.click();

      await inboundListPage.table.row(1).assertIsisNotEmpty();
      await inboundListPage.table.row(2).assertIsEmpty();
      await inboundListPage.table.row(3).assertIsEmpty();
      await inboundListPage.table.row(4).assertIsEmpty();

      await inboundListPage.filters.clearButton.click();
      await expect(inboundListPage.filters.searchField.textbox).toBeEmpty();
      await inboundListPage.table.row(1).assertIsisNotEmpty();
      await inboundListPage.table.row(2).assertIsisNotEmpty();
      await inboundListPage.table.row(3).assertIsisNotEmpty();
      await inboundListPage.table.row(4).assertIsisNotEmpty();
    });
  });

  test.describe('Receipt status filter', () => {
    test('Filter by "Pending" status', async ({
      inboundListPage,
      stockMovementService,
      mainLocation,
      supplierLocation,
      genericService,
    }) => {
      const STOCK_MOVEMENT_COUNT = 2;
      const PENDNING_SHIPMENTS: StockMovementResponse[] = [];
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const {
        data: { user },
      } = await genericService.getAppContext();

      for (const _ of Array(STOCK_MOVEMENT_COUNT)) {
        const { data } = await stockMovementService.createStockMovement({
          description: uniqueIdentifier.generateUniqueString('Pending SM'),
          destination: { id: mainLocationLocation.id },
          origin: { id: supplierLocationLocation.id },
          requestedBy: { id: user.id },
          dateRequested: formatDate(new Date()),
        });
        PENDNING_SHIPMENTS.push(data);
      }

      await inboundListPage.goToPage();
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption('Pending')
        .click();
      await inboundListPage.filters.searchButton.click();

      const rowCount = await inboundListPage.table.allStatusColumnCells.count();
      await expect(inboundListPage.table.allStatusColumnCells).toHaveText(
        Array(rowCount).fill('Pending')
      );
    });

    test('Filter by "Shipped" status', async ({
      inboundListPage,
      stockMovementService,
      mainLocation,
      supplierLocation,
      genericService,
      mainProduct,
    }) => {
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const STOCK_MOVEMENT_COUNT = 2;
      const PENDNING_SHIPMENTS: StockMovementResponse[] = [];

      for (const _ of Array(STOCK_MOVEMENT_COUNT)) {
        const { data } = await stockMovementService.createStockMovement({
          description: uniqueIdentifier.generateUniqueString('Shipped SM'),
          destination: { id: mainLocationLocation.id },
          origin: { id: supplierLocationLocation.id },
          requestedBy: { id: user.id },
          dateRequested: formatDate(new Date()),
        });
        await stockMovementService.addItemsToInboundStockMovement(data.id, {
          id: data.id,
          lineItems: [
            {
              product: { id: product.id },
              quantityRequested: '2',
              sortOrder: 100,
            },
          ],
        });
        await stockMovementService.sendInboundStockMovement(data.id, {
          dateShipped: formatDate(new Date()),
          expectedDeliveryDate: formatDate(new Date()),
          shipmentType: '1',
        });
        PENDNING_SHIPMENTS.push(data);
      }

      await inboundListPage.goToPage();
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption('Shipped')
        .click();
      await inboundListPage.filters.searchButton.click();

      const rowCount = await inboundListPage.table.allStatusColumnCells.count();
      await expect(inboundListPage.table.allStatusColumnCells).toHaveText(
        Array(rowCount).fill('Shipped')
      );
    });
  });

  test('Use "Origin" filter', async ({
    stockMovementService,
    supplierAltLocation,
    supplierLocation,
    mainLocation,
    genericService,
    inboundListPage,
  }) => {
    const mainLocationLocation = await mainLocation.getLocation();
    const supplierLocationLocation = await supplierLocation.getLocation();
    const supplierAltLocationLocation = await supplierAltLocation.getLocation();
    const {
      data: { user },
    } = await genericService.getAppContext();

    await stockMovementService.createStockMovement({
      description: uniqueIdentifier.generateUniqueString('SM supplier ONE'),
      destination: { id: mainLocationLocation.id },
      origin: { id: supplierLocationLocation.id },
      requestedBy: { id: user.id },
      dateRequested: formatDate(new Date()),
    });

    await stockMovementService.createStockMovement({
      description: uniqueIdentifier.generateUniqueString('SM supplier TWO'),
      destination: { id: mainLocationLocation.id },
      origin: { id: supplierAltLocationLocation.id },
      requestedBy: { id: user.id },
      dateRequested: formatDate(new Date()),
    });

    await inboundListPage.goToPage();
    await inboundListPage.filters.originSelect.findAndSelectOption(
      supplierLocationLocation.name
    );
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();

    let originColumnsContent =
      await inboundListPage.table.allOriginColumnCells.allTextContents();
    originColumnsContent = originColumnsContent.filter((it) => !!it.trim());

    expect(originColumnsContent.length).toBeGreaterThan(0);
    expect(originColumnsContent).toEqual(
      Array(originColumnsContent.length).fill(supplierLocationLocation.name)
    );

    await inboundListPage.filters.originSelect.findAndSelectOption(
      supplierAltLocationLocation.name
    );
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();

    originColumnsContent =
      await inboundListPage.table.allOriginColumnCells.allTextContents();
    originColumnsContent = originColumnsContent.filter((it) => !!it.trim());

    expect(originColumnsContent.length).toBeGreaterThan(0);
    expect(originColumnsContent).toEqual(
      Array(originColumnsContent.length).fill(supplierAltLocationLocation.name)
    );
  });

  // eslint-disable-next-line playwright/expect-expect
  test('"Destination" filter should be disabled', async ({
    inboundListPage,
  }) => {
    await inboundListPage.goToPage();
    await inboundListPage.filters.destinationSelect.assertDisabled();
  });

  test.describe('Shipment type filter', () => {
    test('Shipment Type "Air"', async ({
      mainLocation,
      supplierLocation,
      mainProduct,
      genericService,
      stockMovementService,
      inboundListPage,
      page,
    }) => {
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const { data } = await stockMovementService.createStockMovement({
        description: uniqueIdentifier.generateUniqueString('Air SM'),
        destination: { id: mainLocationLocation.id },
        origin: { id: supplierLocationLocation.id },
        requestedBy: { id: user.id },
        dateRequested: formatDate(new Date()),
      });

      await stockMovementService.addItemsToInboundStockMovement(data.id, {
        id: data.id,
        lineItems: [
          {
            product: { id: product.id },
            quantityRequested: '2',
            sortOrder: 100,
          },
        ],
      });
      await stockMovementService.sendInboundStockMovement(data.id, {
        dateShipped: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        expectedDeliveryDate: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        shipmentType: '1',
      });

      await inboundListPage.goToPage();

      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Air')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: data.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Air');

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Sea')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Land')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Suitcase')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Default')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();
    });

    test('Shipment Type "Sea"', async ({
      mainLocation,
      supplierLocation,
      mainProduct,
      genericService,
      stockMovementService,
      inboundListPage,
      page,
    }) => {
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const { data } = await stockMovementService.createStockMovement({
        description: uniqueIdentifier.generateUniqueString('Sea SM'),
        destination: { id: mainLocationLocation.id },
        origin: { id: supplierLocationLocation.id },
        requestedBy: { id: user.id },
        dateRequested: formatDate(new Date()),
      });

      await stockMovementService.addItemsToInboundStockMovement(data.id, {
        id: data.id,
        lineItems: [
          {
            product: { id: product.id },
            quantityRequested: '2',
            sortOrder: 100,
          },
        ],
      });
      await stockMovementService.sendInboundStockMovement(data.id, {
        dateShipped: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        expectedDeliveryDate: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        shipmentType: '2',
      });

      await inboundListPage.goToPage();

      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Sea')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: data.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Sea');

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Air')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Land')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Suitcase')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Default')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();
    });

    test('Shipment Type "Land"', async ({
      mainLocation,
      supplierLocation,
      mainProduct,
      genericService,
      stockMovementService,
      inboundListPage,
      page,
    }) => {
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const { data } = await stockMovementService.createStockMovement({
        description: uniqueIdentifier.generateUniqueString('Land SM'),
        destination: { id: mainLocationLocation.id },
        origin: { id: supplierLocationLocation.id },
        requestedBy: { id: user.id },
        dateRequested: formatDate(new Date()),
      });

      await stockMovementService.addItemsToInboundStockMovement(data.id, {
        id: data.id,
        lineItems: [
          {
            product: { id: product.id },
            quantityRequested: '2',
            sortOrder: 100,
          },
        ],
      });
      await stockMovementService.sendInboundStockMovement(data.id, {
        dateShipped: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        expectedDeliveryDate: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        shipmentType: '3',
      });

      await inboundListPage.goToPage();

      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Land')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: data.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Land');

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Air')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Sea')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Suitcase')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Default')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();
    });

    test('Shipment Type "Suitcase"', async ({
      mainLocation,
      supplierLocation,
      mainProduct,
      genericService,
      stockMovementService,
      inboundListPage,
      page,
    }) => {
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const { data } = await stockMovementService.createStockMovement({
        description: uniqueIdentifier.generateUniqueString('Land SM'),
        destination: { id: mainLocationLocation.id },
        origin: { id: supplierLocationLocation.id },
        requestedBy: { id: user.id },
        dateRequested: formatDate(new Date()),
      });

      await stockMovementService.addItemsToInboundStockMovement(data.id, {
        id: data.id,
        lineItems: [
          {
            product: { id: product.id },
            quantityRequested: '2',
            sortOrder: 100,
          },
        ],
      });
      await stockMovementService.sendInboundStockMovement(data.id, {
        dateShipped: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        expectedDeliveryDate: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        shipmentType: '4',
      });

      await inboundListPage.goToPage();

      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Suitcase')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: data.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Suitcase');

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Air')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Sea')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Land')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Default')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();
    });

    test('Shipment Type "Default"', async ({
      mainLocation,
      supplierLocation,
      mainProduct,
      genericService,
      stockMovementService,
      inboundListPage,
      page,
    }) => {
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const { data } = await stockMovementService.createStockMovement({
        description: uniqueIdentifier.generateUniqueString('Land SM'),
        destination: { id: mainLocationLocation.id },
        origin: { id: supplierLocationLocation.id },
        requestedBy: { id: user.id },
        dateRequested: formatDate(new Date()),
      });

      await stockMovementService.addItemsToInboundStockMovement(data.id, {
        id: data.id,
        lineItems: [
          {
            product: { id: product.id },
            quantityRequested: '2',
            sortOrder: 100,
          },
        ],
      });
      await stockMovementService.sendInboundStockMovement(data.id, {
        dateShipped: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        expectedDeliveryDate: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
      });

      await inboundListPage.goToPage();

      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Default')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: data.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Default');

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Air')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Sea')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Land')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.clearButton.click();
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Suitcase')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: data.identifier })
      ).toBeHidden();
    });

    test('Multiple Shipment Type "Land" & "Sea"', async ({
      mainLocation,
      supplierLocation,
      mainProduct,
      genericService,
      stockMovementService,
      inboundListPage,
      page,
    }) => {
      const mainLocationLocation = await mainLocation.getLocation();
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();
      const {
        data: { user },
      } = await genericService.getAppContext();

      const { data: landShipment } =
        await stockMovementService.createStockMovement({
          description: uniqueIdentifier.generateUniqueString('Land SM'),
          destination: { id: mainLocationLocation.id },
          origin: { id: supplierLocationLocation.id },
          requestedBy: { id: user.id },
          dateRequested: formatDate(new Date()),
        });

      await stockMovementService.addItemsToInboundStockMovement(
        landShipment.id,
        {
          id: landShipment.id,
          lineItems: [
            {
              product: { id: product.id },
              quantityRequested: '2',
              sortOrder: 100,
            },
          ],
        }
      );
      await stockMovementService.sendInboundStockMovement(landShipment.id, {
        dateShipped: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        expectedDeliveryDate: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        shipmentType: '3',
      });

      const { data: seaShipment } =
        await stockMovementService.createStockMovement({
          description: uniqueIdentifier.generateUniqueString('Land SM'),
          destination: { id: mainLocationLocation.id },
          origin: { id: supplierLocationLocation.id },
          requestedBy: { id: user.id },
          dateRequested: formatDate(new Date()),
        });

      await stockMovementService.addItemsToInboundStockMovement(
        seaShipment.id,
        {
          id: seaShipment.id,
          lineItems: [
            {
              product: { id: product.id },
              quantityRequested: '2',
              sortOrder: 100,
            },
          ],
        }
      );
      await stockMovementService.sendInboundStockMovement(seaShipment.id, {
        dateShipped: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        expectedDeliveryDate: formatDate(new Date(), 'MM/DD/YYYY HH:mm Z'),
        shipmentType: '2',
      });

      await inboundListPage.goToPage();

      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Default')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: landShipment.identifier })
      ).toBeHidden();
      await expect(
        inboundListPage.table.rows.filter({ hasText: seaShipment.identifier })
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
        inboundListPage.table.rows.filter({ hasText: landShipment.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: landShipment.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Land');
      await expect(
        inboundListPage.table.rows.filter({ hasText: seaShipment.identifier })
      ).toBeHidden();

      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption('Sea')
        .click();
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(
        inboundListPage.table.rows.filter({ hasText: landShipment.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: landShipment.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Land');

      await expect(
        inboundListPage.table.rows.filter({ hasText: seaShipment.identifier })
      ).toBeVisible();
      await inboundListPage.table.rows
        .getByRole('link', { name: seaShipment.identifier })
        .hover();
      await expect(page.getByRole('tooltip')).toContainText('Sea');
    });
  });

  test('Use "Created By" filter', async ({
    browser,
    mainLocation,
    supplierLocation,
    genericService,
    stockMovementService,
    inboundListPage,
  }) => {
    const mainLocationLocation = await mainLocation.getLocation();
    const supplierLocationLocation = await supplierLocation.getLocation();
    const {
      data: { user },
    } = await genericService.getAppContext();

    const { data } = await stockMovementService.createStockMovement({
      description: uniqueIdentifier.generateUniqueString('Land SM'),
      destination: { id: mainLocationLocation.id },
      origin: { id: supplierLocationLocation.id },
      requestedBy: { id: user.id },
      dateRequested: formatDate(new Date()),
    });

    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.alternative.storagePath,
    });
    const newPage = await newCtx.newPage();
    const otherSotckMvoementService = new StockMovementService(newPage.request);
    const otherGenericService = new GenericService(newPage.request);
   
    const {
      data: { user: otherUser },
    } = await otherGenericService.getAppContext();

    const { data: otherData } = await otherSotckMvoementService.createStockMovement({
      description: uniqueIdentifier.generateUniqueString('other SM'),
      destination: { id: mainLocationLocation.id },
      origin: { id: supplierLocationLocation.id },
      requestedBy: { id: user.id },
      dateRequested: formatDate(new Date()),
    });
    await newCtx.close();

    await inboundListPage.goToPage();

    await inboundListPage.filters.createdBySelect.findAndSelectOption(user.name);
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();
    await expect(inboundListPage.table.rows.filter({ hasText: data.identifier })).toBeVisible();
    await expect(inboundListPage.table.rows.filter({ hasText: otherData.identifier })).toBeHidden();

    await inboundListPage.filters.clearButton.click();
    await inboundListPage.waitForResponse();

    await inboundListPage.filters.createdBySelect.findAndSelectOption(otherUser.name);
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();
    await expect(inboundListPage.table.rows.filter({ hasText: data.identifier })).toBeHidden();
    await expect(inboundListPage.table.rows.filter({ hasText: otherData.identifier })).toBeVisible();
  });

  // TODO: there is bug in the app when filtering by updatedBy
  test.skip('Use "Updated By" filter', async ({
    browser,
    mainLocation,
    supplierLocation,
    genericService,
    stockMovementService,
    inboundListPage,
    mainProduct,
  }) => {
    const mainLocationLocation = await mainLocation.getLocation();
    const supplierLocationLocation = await supplierLocation.getLocation();
    const product = await mainProduct.getProduct();

    const {
      data: { user },
    } = await genericService.getAppContext();

    const { data } = await stockMovementService.createStockMovement({
      description: uniqueIdentifier.generateUniqueString('Land SM'),
      destination: { id: mainLocationLocation.id },
      origin: { id: supplierLocationLocation.id },
      requestedBy: { id: user.id },
      dateRequested: formatDate(new Date()),
    });

    console.log(data.identifier)

    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.alternative.storagePath,
    });
    const newPage = await newCtx.newPage();
    const otherSotckMvoementService = new StockMovementService(newPage.request);
    const otherGenericService = new GenericService(newPage.request);
   
    const {
      data: { user: otherUser },
    } = await otherGenericService.getAppContext();

    await inboundListPage.goToPage();

    await inboundListPage.filters.updatedBySelect.findAndSelectOption(user.name);
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();
    await expect(inboundListPage.table.rows.filter({ hasText: data.identifier })).toBeVisible();

    await inboundListPage.filters.clearButton.click();
    await inboundListPage.waitForResponse();

    await inboundListPage.filters.updatedBySelect.findAndSelectOption(otherUser.name);
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();
    await expect(inboundListPage.table.rows.filter({ hasText: data.identifier })).toBeHidden();
    
    await otherSotckMvoementService.addItemsToInboundStockMovement(data.id, {
      id: data.id,
      lineItems: [
        {
          product: { id: product.id },
          quantityRequested: '2',
          sortOrder: 100,
        },
      ],
    });
    await newCtx.close();

    await inboundListPage.filters.clearButton.click();
    await inboundListPage.waitForResponse();

    await inboundListPage.filters.updatedBySelect.findAndSelectOption(otherUser.name);
    await inboundListPage.filters.searchButton.click();
    await inboundListPage.waitForResponse();
    await expect(inboundListPage.table.rows.filter({ hasText: data.identifier })).toBeVisible();
  });

  // test('Use "Updated By" filter', async ({ page }) => {
  //   //
  // });

  // test('Use "Created After" filter', async ({ page }) => {
  //   //
  // });

  // test('Use "Created Before" filter', async ({ page }) => {
  //   //
  // });

  // test('Clear filters', async ({ page }) => {
  //   //
  // });
});
