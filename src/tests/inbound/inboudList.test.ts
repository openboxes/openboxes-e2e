import dayjs from 'dayjs';

import GenericService from '@/api/GenericService';
import StockMovementService from '@/api/StockMovementService';
import AppConfig from '@/config/AppConfig';
import { ReceiptStatus } from '@/constants/ReceiptStatus';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDayOfMonth, getToday } from '@/utils/DateUtils';
import LocationData from '@/utils/LocationData';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

const uniqueIdentifier = new UniqueIdentifier();

test.describe('Inbond Stock Movement list page', () => {
  test.describe('Search filter', () => {
    let STOCK_MOVEMENT: StockMovementResponse;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const stockMovementService = new StockMovementService(page.request);
      const supplierLocationService = new LocationData(
        'supplier',
        page.request
      );
      const supplierLocation = await supplierLocationService.getLocation();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });
      await page.close();
    });

    test('Search stock movement by identifier', async ({ inboundListPage }) => {
      await test.step('Go to inbound list page', async () => {
        await inboundListPage.goToPage();
      });

      await test.step('Search by stock movement identifier', async () => {
        await inboundListPage.filters.searchField.textbox.fill(
          STOCK_MOVEMENT.identifier
        );
        await inboundListPage.filters.searchButton.click();
        await inboundListPage.waitForResponse();
      });

      const rowsContent = await inboundListPage.table.rows.allTextContents();
      const filteredRows = rowsContent.filter((it) => !!it.trim());

      expect(filteredRows).toHaveLength(1);
      const firstRow = filteredRows[0];
      expect(firstRow).toContain(STOCK_MOVEMENT.identifier);
      expect(firstRow).toContain(STOCK_MOVEMENT.description);
    });

    test('Execute search filter by pressing Enter key', async ({
      page,
      inboundListPage,
    }) => {
      await test.step('Go to inbound list page', async () => {
        await inboundListPage.goToPage();
      });
      await test.step('Search inbound by identifier', async () => {
        await inboundListPage.filters.searchField.textbox.fill(
          STOCK_MOVEMENT.identifier
        );
        await page.keyboard.press('Enter');
        await inboundListPage.waitForResponse();
      });

      const rowsContent = await inboundListPage.table.rows.allTextContents();
      const filteredRows = rowsContent.filter((it) => !!it.trim());

      expect(filteredRows).toHaveLength(1);
      const firstRow = filteredRows[0];
      expect(firstRow).toContain(STOCK_MOVEMENT.identifier);
      expect(firstRow).toContain(STOCK_MOVEMENT.description);
    });
  });

  test.describe('Receipt status filter', () => {
    test('Filter by "Pending" status', async ({
      inboundListPage,
      stockMovementService,
      supplierLocation,
    }) => {
      const supplierLocationLocation = await supplierLocation.getLocation();
      await stockMovementService.createInbound({
        originId: supplierLocationLocation.id,
      });

      await test.step('Go to inbound list page', async () => {
        await inboundListPage.goToPage();
      });

      await test.step('Filter by Receipt status "Pending"', async () => {
        await inboundListPage.filters.receiptStatusSelect.click();
        await inboundListPage.filters.receiptStatusSelect
          .getSelectOption(ReceiptStatus.PENDING)
          .click();
        await inboundListPage.filters.searchButton.click();
        await inboundListPage.waitForResponse();
      });

      const statusColumnValues =
        await inboundListPage.table.allStatusColumnCells.allTextContents();
      const filteredEmptyValues = statusColumnValues.filter(
        (it) => !!it.trim()
      );

      await expect(inboundListPage.table.allStatusColumnCells).toHaveText(
        Array(filteredEmptyValues.length).fill(ReceiptStatus.PENDING)
      );
    });

    test('Filter by "Shipped" status', async ({
      inboundListPage,
      stockMovementService,
      supplierLocation,
      mainProduct,
    }) => {
      const supplierLocationLocation = await supplierLocation.getLocation();
      const product = await mainProduct.getProduct();

      const STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocationLocation.id,
      });
      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 2 }]
      );

      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });

      await test.step('Go to inbound list page', async () => {
        await inboundListPage.goToPage();
      });

      await test.step('Filter by Receipt status "Shipped"', async () => {
        await inboundListPage.filters.receiptStatusSelect.click();
        await inboundListPage.filters.receiptStatusSelect
          .getSelectOption(ReceiptStatus.SHIPPED)
          .click();
        await inboundListPage.filters.searchButton.click();
        await inboundListPage.waitForResponse();
      });

      const rowCount = await inboundListPage.table.allStatusColumnCells.count();
      await expect(inboundListPage.table.allStatusColumnCells).toHaveText(
        Array(rowCount).fill(ReceiptStatus.SHIPPED)
      );
    });
  });

  test('Use "Origin" filter', async ({
    stockMovementService,
    supplierAltLocation,
    supplierLocation,
    inboundListPage,
  }) => {
    const supplierLocationLocation = await supplierLocation.getLocation();
    const supplierAltLocationLocation = await supplierAltLocation.getLocation();

    const STOCK_MOVEMENT_SUPPLIER = await stockMovementService.createInbound({
      originId: supplierLocationLocation.id,
    });

    const STOCK_MOVEMENT_SUPPLIER_ALT_ =
      await stockMovementService.createInbound({
        originId: supplierAltLocationLocation.id,
      });

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by origin of one supplier location', async () => {
      await inboundListPage.filters.originSelect.findAndSelectOption(
        supplierLocationLocation.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    const originColumnsText =
      await inboundListPage.table.allOriginColumnCells.allTextContents();
    const filteredEmptyOriginValues = originColumnsText.filter(
      (it) => !!it.trim()
    );

    expect(filteredEmptyOriginValues.length).toBeGreaterThan(0);
    expect(filteredEmptyOriginValues).toEqual(
      Array(filteredEmptyOriginValues.length).fill(
        supplierLocationLocation.name
      )
    );
    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT_SUPPLIER.identifier
    );
    await expect(inboundListPage.table.table).not.toContainText(
      STOCK_MOVEMENT_SUPPLIER_ALT_.identifier
    );

    await test.step('Filter by origin of alternative supplier location', async () => {
      await inboundListPage.filters.originSelect.findAndSelectOption(
        supplierAltLocationLocation.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    const originColumnsTextAltSupplier =
      await inboundListPage.table.allOriginColumnCells.allTextContents();
    const filteredEmptyOriginValuesAltSupplier =
      originColumnsTextAltSupplier.filter((it) => !!it.trim());

    expect(filteredEmptyOriginValuesAltSupplier.length).toBeGreaterThan(0);
    expect(filteredEmptyOriginValuesAltSupplier).toEqual(
      Array(filteredEmptyOriginValuesAltSupplier.length).fill(
        supplierAltLocationLocation.name
      )
    );
    await expect(inboundListPage.table.table).toContainText(
      STOCK_MOVEMENT_SUPPLIER_ALT_.identifier
    );
    await expect(inboundListPage.table.table).not.toContainText(
      STOCK_MOVEMENT_SUPPLIER.identifier
    );
  });

  test('"Destination" filter should be disabled', async ({
    inboundListPage,
  }) => {
    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await inboundListPage.filters.destinationSelect.assertDisabled();
  });

  test.describe('Shipment type filter', () => {
    const SHIPMENT_TYPES = [
      ShipmentType.AIR,
      ShipmentType.LAND,
      ShipmentType.SEA,
      ShipmentType.SUITCASE,
      ShipmentType.DEFAULT,
    ];

    for (const shipmentType of SHIPMENT_TYPES) {
      test(`Shipment Type "${shipmentType}"`, async ({
        supplierLocation,
        mainProduct,
        stockMovementService,
        inboundListPage,
        page,
      }) => {
        const supplierLocationLocation = await supplierLocation.getLocation();
        const product = await mainProduct.getProduct();

        const STOCK_MOVEMENT = await stockMovementService.createInbound({
          originId: supplierLocationLocation.id,
        });

        await stockMovementService.addItemsToInboundStockMovement(
          STOCK_MOVEMENT.id,
          [{ productId: product.id, quantity: 2 }]
        );
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
        [{ productId: product.id, quantity: 2 }]
      );

      await stockMovementService.sendInboundStockMovement(landShipment.id, {
        shipmentType: ShipmentType.LAND,
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
        [{ productId: product.id, quantity: 2 }]
      );

      await stockMovementService.sendInboundStockMovement(seaShipment.id, {
        shipmentType: ShipmentType.SEA,
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
    supplierLocation,
    genericService,
    stockMovementService,
    inboundListPage,
  }) => {
    const supplierLocationLocation = await supplierLocation.getLocation();
    const user = await genericService.getLoggedInUser();

    let STOCK_MOVEMENT: StockMovementResponse;
    let STOCK_MOVEMENT_OTHER: StockMovementResponse;

    await test.step('Create stock movement for main user', async () => {
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        requestorId: user.id,
        originId: supplierLocationLocation.id,
      });
    });

    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.alternative.storagePath,
    });
    const newPage = await newCtx.newPage();

    await test.step('Create stock movement with alternative user', async () => {
      const otherSotckMvoementService = new StockMovementService(
        newPage.request
      );
      STOCK_MOVEMENT_OTHER = await otherSotckMvoementService.createInbound({
        requestorId: user.id,
        originId: supplierLocationLocation.id,
      });
    });

    const otherGenericService = new GenericService(newPage.request);
    const otherUser = await otherGenericService.getLoggedInUser();

    await newCtx.close();

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter by main user', async () => {
      await inboundListPage.filters.createdBySelect.findAndSelectOption(
        user.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT_OTHER.identifier
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.filters.clearButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Filter by alternative user', async () => {
      await inboundListPage.filters.createdBySelect.findAndSelectOption(
        otherUser.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();

      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT_OTHER.identifier
      );
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });

  // TODO: there is bug in the app when filtering by updatedBy
  test.skip('Use "Updated By" filter', async ({
    browser,
    supplierLocation,
    genericService,
    stockMovementService,
    inboundListPage,
    mainProduct,
  }) => {
    const supplierLocationLocation = await supplierLocation.getLocation();
    const product = await mainProduct.getProduct();
    const user = await genericService.getLoggedInUser();

    const STOCK_MOVEMENT = await stockMovementService.createInbound({
      requestorId: user.id,
      originId: supplierLocationLocation.id,
    });

    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.alternative.storagePath,
    });

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter updated by "main user"', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        user.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Assert that stock movement is visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.filters.clearButton.click();
      await inboundListPage.waitForResponse();
    });

    const newPage = await newCtx.newPage();
    const otherSotckMvoementService = new StockMovementService(newPage.request);
    const otherGenericService = new GenericService(newPage.request);

    const otherUser = await otherGenericService.getLoggedInUser();

    await test.step('Filter updated by other user', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        otherUser.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Assert that stock movement is not visible in the table', async () => {
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Update stock movement by other user', async () => {
      await otherSotckMvoementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [{ productId: product.id, quantity: 2 }]
      );
    });
    await newCtx.close();

    await test.step('Clear filters', async () => {
      await inboundListPage.filters.clearButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Filter updated by other user', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        otherUser.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Assert that stock movement is not visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });

  test('"Requested By" filter', async ({
    browser,
    supplierLocation,
    genericService,
    stockMovementService,
    inboundListPage,
  }) => {
    const supplierLocationLocation = await supplierLocation.getLocation();
    const user = await genericService.getLoggedInUser();

    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.alternative.storagePath,
    });
    const newPage = await newCtx.newPage();
    const otherGenericService = new GenericService(newPage.request);

    const otherUser = await otherGenericService.getLoggedInUser();

    await newCtx.close();

    const STOCK_MOVEMENT = await stockMovementService.createInbound({
      requestorId: otherUser.id,
      originId: supplierLocationLocation.id,
    });

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Filter requested by "main user"', async () => {
      await inboundListPage.filters.requestedBySelect.findAndSelectOption(
        user.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Assert stock movement not to be visible in the table', async () => {
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.filters.clearButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Filter requested by "other user"', async () => {
      await inboundListPage.filters.requestedBySelect.findAndSelectOption(
        otherUser.name
      );
      await inboundListPage.filters.searchButton.click();
      await inboundListPage.waitForResponse();
    });

    await test.step('Assert stock movement to be visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });

  test.describe('Date created filters', () => {
    test.beforeAll(async ({ browser }) => {
      const newPage = await browser.newPage();

      const stockMovementService = new StockMovementService(newPage.request);
      const supplierLocation = new LocationData('supplier', newPage.request);

      const supplierLocationLocation = await supplierLocation.getLocation();

      await stockMovementService.createInbound({
        originId: supplierLocationLocation.id,
      });

      await newPage.close();
    });

    test('"Created After" filter', async ({ inboundListPage }) => {
      const TODAY = getToday();

      await test.step('Go to inbound list page', async () => {
        await inboundListPage.goToPage();
      });

      await test.step(`Filter by created after ${formatDate(TODAY)}`, async () => {
        await inboundListPage.filters.createdAfterDateFilter.click();
        await inboundListPage.filters.createdAfterDateFilter
          .getMonthDay(getDayOfMonth(TODAY))
          .click();
        await inboundListPage.filters.searchButton.click();
        await inboundListPage.waitForResponse();
      });

      const dateCreatedColumnsContent =
        await inboundListPage.table.allDateCreatedColumnCells.allTextContents();
      const filteredEmptyDateCreatedValues = dateCreatedColumnsContent
        .filter((it) => !!it.trim())
        .map((it) => dayjs(it).toDate());

      for (const date of filteredEmptyDateCreatedValues) {
        expect(date.getTime()).toBeGreaterThanOrEqual(TODAY.getTime());
      }
    });

    test('"Created Before" filter', async ({ inboundListPage }) => {
      const TODAY = getToday();

      await test.step('Go to inbound list page', async () => {
        await inboundListPage.goToPage();
      });

      await test.step(`Filter by created before ${formatDate(TODAY)}`, async () => {
        await inboundListPage.filters.createdBeforeDateFilter.click();
        await inboundListPage.filters.createdBeforeDateFilter
          .getMonthDay(getDayOfMonth(TODAY))
          .click();
        await inboundListPage.filters.searchButton.click();
        await inboundListPage.waitForResponse();
      });

      const dateCreatedColumnsContent =
        await inboundListPage.table.allDateCreatedColumnCells.allTextContents();
      const filteredEmptyDateCreatedValues = dateCreatedColumnsContent
        .filter((it) => !!it.trim())
        .map((it) => dayjs(it).toDate());

      for (const date of filteredEmptyDateCreatedValues) {
        expect(date.getTime()).toBeLessThan(TODAY.getTime());
      }
    });
  });

  test('Clear filters', async ({
    inboundListPage,
    supplierLocation,
    mainLocation,
    genericService,
  }) => {
    const mainLocationLocation = await mainLocation.getLocation();
    const supplierLocationLocation = await supplierLocation.getLocation();
    const user = await genericService.getLoggedInUser();
    const TODAY = getToday();

    const filters = {
      search: 'TEST',
      receiptStatus: 'Created',
      destination: mainLocationLocation.name,
      origin: supplierLocationLocation.name,
      shipmentType: 'Air',
      requestedBy: user.name,
      createdBy: user.name,
      updatedBy: user.name,
      createdAfter: TODAY,
      createdBefore: TODAY,
    };

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Fill search filter', async () => {
      await inboundListPage.filters.searchField.textbox.fill(filters.search);
    });

    await test.step('Fill receipt status filter', async () => {
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(filters.receiptStatus)
        .click();
    });

    await test.step('Fill origin filter', async () => {
      await inboundListPage.filters.originSelect.findAndSelectOption(
        supplierLocationLocation.name
      );
    });

    await test.step('Fill shipment type filter', async () => {
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption(filters.shipmentType)
        .click();
    });

    await test.step('Fill requested by filter', async () => {
      await inboundListPage.filters.requestedBySelect.findAndSelectOption(
        user.name
      );
    });

    await test.step('Fill created by filter', async () => {
      await inboundListPage.filters.createdBySelect.findAndSelectOption(
        user.name
      );
    });

    await test.step('Fill updated by filter', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        user.name
      );
    });

    await test.step('Fill created Before filter', async () => {
      await inboundListPage.filters.createdBeforeDateFilter.click();
      await inboundListPage.filters.createdBeforeDateFilter
        .getMonthDay(getDayOfMonth(filters.createdBefore))
        .click();
    });

    await test.step('Fill created after filter', async () => {
      await inboundListPage.filters.createdAfterDateFilter.click();
      await inboundListPage.filters.createdAfterDateFilter
        .getMonthDay(getDayOfMonth(filters.createdAfter))
        .click();
    });

    await test.step('Assert that all filters are filled', async () => {
      await expect(inboundListPage.filters.searchField.textbox).toHaveValue(
        filters.search
      );
      await expect(
        inboundListPage.filters.receiptStatusSelect.countIndicator
      ).toBeVisible();
      await expect(inboundListPage.filters.originSelect.field).toContainText(
        filters.origin
      );
      await expect(
        inboundListPage.filters.destinationSelect.field
      ).toContainText(filters.destination);
      await expect(
        inboundListPage.filters.shipmentTypeSelect.countIndicator
      ).toBeVisible();
      await expect(
        inboundListPage.filters.requestedBySelect.field
      ).toContainText(filters.requestedBy);
      await expect(inboundListPage.filters.createdBySelect.field).toContainText(
        filters.createdBy
      );
      await expect(inboundListPage.filters.updatedBySelect.field).toContainText(
        filters.updatedBy
      );
      await expect(
        inboundListPage.filters.createdAfterDateFilter.field
      ).toContainText(formatDate(filters.createdAfter));
      await expect(
        inboundListPage.filters.createdBeforeDateFilter.field
      ).toContainText(formatDate(filters.createdBefore));
    });

    await test.step('Clear filters', async () => {
      await inboundListPage.filters.clearButton.click();
    });

    await test.step('Assert that destination filter is not cleared', async () => {
      await expect(
        inboundListPage.filters.destinationSelect.field
      ).toContainText(filters.destination);
    });

    await test.step('Assert that all filteres are cleared', async () => {
      await expect(inboundListPage.filters.searchField.textbox).not.toHaveValue(
        filters.search
      );
      await expect(
        inboundListPage.filters.receiptStatusSelect.countIndicator
      ).toBeHidden();
      await expect(
        inboundListPage.filters.originSelect.field
      ).not.toContainText(filters.origin);
      await expect(
        inboundListPage.filters.shipmentTypeSelect.countIndicator
      ).toBeHidden();
      await expect(
        inboundListPage.filters.requestedBySelect.field
      ).not.toContainText(filters.requestedBy);
      await expect(
        inboundListPage.filters.createdBySelect.field
      ).not.toContainText(filters.createdBy);
      await expect(
        inboundListPage.filters.updatedBySelect.field
      ).not.toContainText(filters.updatedBy);
      await expect(
        inboundListPage.filters.createdAfterDateFilter.field
      ).not.toContainText(formatDate(filters.createdAfter));
      await expect(
        inboundListPage.filters.createdBeforeDateFilter.field
      ).not.toContainText(formatDate(filters.createdBefore));
    });
  });
});
