import { expect, test } from '@/fixtures/fixtures';
import InboundListPage from '@/pages/inbound/list/InboundListPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
import {
  AddItemsTableRow,
  LocationResponse,
  User,
} from '@/types';
import { formatDate, getDateByOffset, getToday } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Status changes for inbound sm on view sm and inbound list page', () => {
  const TODAY = getToday();
  let ROWS: AddItemsTableRow[];
  let INBOUND_ID: string;
  const DESCRIPTION = 'some description';
  let ORIGIN: LocationResponse;
  let USER: User;
  const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
  const SHIPMENT_TYPE = 'Land';
  const uniqueIdentifier = new UniqueIdentifier();

  test.beforeEach(
    async ({
      mainProductService,
      otherProductService,
      mainUserService,
      supplierLocationService,
    }) => {
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();
      USER = await mainUserService.getUser();
      ORIGIN = await supplierLocationService.getLocation();

      ROWS = [
        {
          packLevel1: 'pallet1',
          packLevel2: 'box2',
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
          quantity: '50',
          lotNumber: uniqueIdentifier.generateUniqueString('lot'),
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
        },
        {
          packLevel1: 'test-pallet',
          packLevel2: 'test-box',
          productCode: PRODUCT_TWO.productCode,
          productName: PRODUCT_TWO.name,
          quantity: '20',
          lotNumber: 'E2E-lot-test2',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
        },
      ];
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(INBOUND_ID);
  });

  test('Create inbound stock movement and assert statuses on stock movement view page', async ({
    createInboundPage,
    stockMovementShowPage,
  }) => {
    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Fill create stock movement page', async () => {
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        USER.name
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
      await createInboundPage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
    });

    await test.step('Go to add items page)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    INBOUND_ID = createInboundPage.getId();

    await test.step('Add first line items (Add items)', async () => {
      const data = ROWS[0];
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.expirationDate.fill(data.expirationDate);
      await row.recipientSelect.findAndSelectOption(data.recipient);
      await row.packLevel1Field.textbox.fill(data.packLevel1);
      await row.packLevel2Field.textbox.fill(data.packLevel2);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
    });

    await test.step('Add second item to shipment', async () => {
      await createInboundPage.addItemsStep.addLineButton.click();

      const data = ROWS[1];
      const row = createInboundPage.addItemsStep.table.row(1);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(2);
    });

    await test.step('Save and exit from add items page', async () => {
      await createInboundPage.addItemsStep.saveAndExitButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Created stock movement status on view page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Created');
    });

    await test.step('Return to stock movement', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    await test.step('Go to send page', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Fill send page', async () => {
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
    });

    await test.step('Save and exit from send page', async () => {
      await createInboundPage.sendStep.saveAndExitButton.click();
    });

    await test.step('Assert Checking stock movement status on view page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Checking');
    });

    await test.step('Assert data on packing list on view stock movement after save and exit', async () => {
      await stockMovementShowPage.packingListTab.isVisible();
      await expect(
        stockMovementShowPage.packingListTable.row(1).details
      ).toHaveText('Unpacked');
      await expect(
        stockMovementShowPage.packingListTable.row(1).lotNumber
      ).toBeEmpty();
      await expect(
        stockMovementShowPage.packingListTable.row(1).expirationDate
      ).toHaveText('Never');
      await expect(
        stockMovementShowPage.packingListTable.row(1).quantityShipped
      ).toHaveText('20');
      await expect(
        stockMovementShowPage.packingListTable.row(1).recipient
      ).toHaveText('None');

      await expect(
        stockMovementShowPage.packingListTable.row(2).details
      ).toHaveText(`${ROWS[0].packLevel1} › ${ROWS[0].packLevel2}`);
      await expect(
        stockMovementShowPage.packingListTable.row(2).lotNumber
      ).toHaveText(`${ROWS[0].lotNumber}`);
      await expect(
        stockMovementShowPage.packingListTable.row(2).expirationDate
      ).toContainText(formatDate(ROWS[0].expirationDate, 'DD/MMM/YYYY'));
      await expect(
        stockMovementShowPage.packingListTable.row(2).quantityShipped
      ).toHaveText('50');
      await expect(
        stockMovementShowPage.packingListTable.row(2).recipient
      ).toHaveText(`${ROWS[0].recipient}`);
    });

    await test.step('Go to send page and ship stock movement', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Shipped stock movement status on view page', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Shipped');
    });

    await test.step('Assert data on packing list on view stock movement after sending sm', async () => {
      await stockMovementShowPage.packingListTab.isVisible();
      await expect(
        stockMovementShowPage.packingListTable.row(1).details
      ).toHaveText('Unpacked');
      await expect(
        stockMovementShowPage.packingListTable.row(1).lotNumber
      ).toBeEmpty();
      await expect(
        stockMovementShowPage.packingListTable.row(1).expirationDate
      ).toHaveText('Never');
      await expect(
        stockMovementShowPage.packingListTable.row(1).quantityShipped
      ).toHaveText('20');
      await expect(
        stockMovementShowPage.packingListTable.row(1).recipient
      ).toHaveText('None');

      await expect(
        stockMovementShowPage.packingListTable.row(2).details
      ).toHaveText(`${ROWS[0].packLevel1} › ${ROWS[0].packLevel2}`);
      await expect(
        stockMovementShowPage.packingListTable.row(2).lotNumber
      ).toHaveText(`${ROWS[0].lotNumber}`);
      await expect(
        stockMovementShowPage.packingListTable.row(2).expirationDate
      ).toContainText(formatDate(ROWS[0].expirationDate, 'DD/MMM/YYYY'));
      await expect(
        stockMovementShowPage.packingListTable.row(2).quantityShipped
      ).toHaveText('50');
      await expect(
        stockMovementShowPage.packingListTable.row(2).recipient
      ).toHaveText(`${ROWS[0].recipient}`);
    });

    await test.step('Rollback shipment', async () => {
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Checking stock movement status on view page after rollback shipment', async () => {
      await expect(stockMovementShowPage.statusTag).toHaveText('Checking');
    });
  });

  test('Create inbound stock movement and assert statuses on inbound list page', async ({
    createInboundPage,
    stockMovementShowPage,
    browser,
  }) => {
    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Fill create stock movement page', async () => {
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        USER.name
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
      await createInboundPage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
    });

    await test.step('Go to add items page)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    INBOUND_ID = createInboundPage.getId();

    await test.step('Add first line items (Add items)', async () => {
      const data = ROWS[0];
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.expirationDate.fill(data.expirationDate);
      await row.recipientSelect.findAndSelectOption(data.recipient);
      await row.packLevel1Field.textbox.fill(data.packLevel1);
      await row.packLevel2Field.textbox.fill(data.packLevel2);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
    });

    await test.step('Add second item to shipment', async () => {
      await createInboundPage.addItemsStep.addLineButton.click();

      const data = ROWS[1];
      const row = createInboundPage.addItemsStep.table.row(1);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(2);
    });

    await test.step('Save and exit from add items page', async () => {
      await createInboundPage.addItemsStep.saveAndExitButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Pending status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await newStockMovementShowPage.goToPage(INBOUND_ID);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Pending'
      );
      await newPage.close();
    });

    await test.step('Return to stock movement', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    await test.step('Go to send page', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Fill send page', async () => {
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
    });

    await test.step('Save and exit from send page', async () => {
      await createInboundPage.sendStep.saveAndExitButton.click();
    });

    await test.step('Assert Pending status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await newStockMovementShowPage.goToPage(INBOUND_ID);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Pending'
      );
      await newPage.close();
    });

    await test.step('Go to send page and ship stock movement', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Shipped status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await newStockMovementShowPage.goToPage(INBOUND_ID);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Shipped'
      );
      await newPage.close();
    });

    await test.step('Rollback shipment', async () => {
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert Pending status on inbound list page', async () => {
      const newPage = await browser.newPage();
      const newStockMovementShowPage = new StockMovementShowPage(newPage);
      const newInboundListPage = new InboundListPage(newPage);
      await newStockMovementShowPage.goToPage(INBOUND_ID);
      const inboundShipmentIdentifier =
        await newStockMovementShowPage.detailsListTable.identifierValue.textContent();
      await newInboundListPage.goToPage();
      await newInboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await newInboundListPage.search();
      await expect(newInboundListPage.table.row(0).status).toHaveText(
        'Pending'
      );
      await newPage.close();
    });
  });
});
