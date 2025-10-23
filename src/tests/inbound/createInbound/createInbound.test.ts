import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow, LocationResponse, User } from '@/types';
import { formatDate, getDateByOffset, getToday } from '@/utils/DateUtils';

test.describe('Create inbound stock movement', () => {
  const TODAY = getToday();
  let ROWS: AddItemsTableRow[];
  let INBOUND_ID: string;
  const DESCRIPTION = 'some description';
  let ORIGIN: LocationResponse;
  let CURRENT_LOCATION: LocationResponse;
  let USER: User;
  const TRACKING_NUMBER = 'E2E-NUMBER-12345';
  const DRIVER_NAME = 'Test-Name Test-Lastname';
  const COMMENT = 'Test Comment';
  const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
  const SHIPMENT_TYPE = 'Land';

  test.beforeEach(
    async ({
      mainProductService,
      otherProductService,
      mainUserService,
      supplierLocationService,
      mainLocationService,
    }) => {
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();
      USER = await mainUserService.getUser();
      ORIGIN = await supplierLocationService.getLocation();
      CURRENT_LOCATION = await mainLocationService.getLocation();

      ROWS = [
        {
          packLevel1: 'test-pallet',
          packLevel2: 'test-box',
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
          quantity: '12',
          lotNumber: 'E2E-lot-test',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
        },
        {
          packLevel1: 'test-pallet',
          packLevel2: 'test-box',
          productCode: PRODUCT_TWO.productCode,
          productName: PRODUCT_TWO.name,
          quantity: '12',
          lotNumber: 'E2E-lot-test',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
        },
      ];
    }
  );

  test.afterEach(async ({ stockMovementService, stockMovementShowPage }) => {
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(INBOUND_ID);
  });

  test('Create and send inbound stock movement', async ({
    createInboundPage,
    stockMovementShowPage,
  }) => {
    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Create Stock Movement step', async () => {
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

    await test.step('Go next step (Add items)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    INBOUND_ID = createInboundPage.getId();

    await test.step('Assert page header data', async () => {
      await createInboundPage.wizzardSteps.assertActiveStep('Add items');
      await createInboundPage.assertHeaderIsVisible({
        origin: ORIGIN.name,
        destination: CURRENT_LOCATION.name,
        description: DESCRIPTION,
        date: formatDate(TODAY),
      });
    });

    await test.step('Add first line items (Add items)', async () => {
      const data = ROWS[0];
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.recipientSelect.findAndSelectOption(data.recipient);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
    });

    await test.step('Add second line item (Add items)', async () => {
      await createInboundPage.addItemsStep.addLineButton.click();

      const data = ROWS[1];
      const row = createInboundPage.addItemsStep.table.row(1);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.recipientSelect.findAndSelectOption(data.recipient);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(2);
    });

    await test.step('Remove second item', async () => {
      await createInboundPage.addItemsStep.table.row(1).deleteButton.click();
      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
    });

    await test.step('Go to next step (Send)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Fill shipment fields (Send)', async () => {
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.trackingNumberField.textbox.fill(
        TRACKING_NUMBER
      );
      await createInboundPage.sendStep.driverNameField.textbox.fill(
        DRIVER_NAME
      );
      await createInboundPage.sendStep.commentField.textbox.fill(COMMENT);
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
    });

    await test.step('Send shipment', async () => {
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert all values on show page', async () => {
      await expect(
        stockMovementShowPage.auditingTable.dateShippedRow
      ).toContainText(
        `${formatDate(new Date(), 'DD/MMM/YYYY')} by ${USER.name}`
      );
      await expect(
        stockMovementShowPage.auditingTable.dateCreatedRow
      ).toContainText(
        `${formatDate(new Date(), 'DD/MMM/YYYY')} by ${USER.name}`
      );
    });
  });
});

test.describe('Values persistance between steps', () => {
  const TODAY = getToday();
  let ROWS: AddItemsTableRow[];
  let INBOUND_ID: string;
  const DESCRIPTION = 'some description';
  let ORIGIN: LocationResponse;
  let CURRENT_LOCATION: LocationResponse;
  let USER: User;
  const TRACKING_NUMBER = 'E2E-NUMBER-12345';
  const DRIVER_NAME = 'Test-Name Test-Lastname';
  const COMMENT = 'Test Comment';
  const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
  const SHIPMENT_TYPE = 'Land';

  test.beforeEach(
    async ({
      mainProductService,
      otherProductService,
      mainUserService,
      createInboundPage,
      mainLocationService,
      supplierLocationService,
    }) => {
      const PRODUCT_ONE = await mainProductService.getProduct();
      const PRODUCT_TWO = await otherProductService.getProduct();
      USER = await mainUserService.getUser();
      CURRENT_LOCATION = await mainLocationService.getLocation();
      ORIGIN = await supplierLocationService.getLocation();

      ROWS = [
        {
          packLevel1: 'test-pallet',
          packLevel2: 'test-box',
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
          quantity: '12',
          lotNumber: 'E2E-lot-test',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
        },
        {
          packLevel1: 'test-pallet',
          packLevel2: 'test-box',
          productCode: PRODUCT_TWO.productCode,
          productName: PRODUCT_TWO.name,
          quantity: '12',
          lotNumber: 'E2E-lot-test',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
        },
      ];

      await test.step('Go to create inbound page', async () => {
        await createInboundPage.goToPage();
        await createInboundPage.wizzardSteps.assertActiveStep('Create');
        await createInboundPage.createStep.isLoaded();
      });

      await test.step('Create Stock Movement step', async () => {
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

      await test.step('Go next step (Add items)', async () => {
        await createInboundPage.nextButton.click();
        await createInboundPage.addItemsStep.isLoaded();
        await createInboundPage.wizzardSteps.assertActiveStep('Add items');
      });

      INBOUND_ID = createInboundPage.getId();
    }
  );

  test.afterEach(async ({ stockMovementService }) => {
    await stockMovementService.deleteStockMovement(INBOUND_ID);
  });

  test('Assert that all values are persisted between going back and forth through workflow steps', async ({
    createInboundPage,
  }) => {
    await test.step('Go previous step (Create)', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Assert data in fields (Create)', async () => {
      await expect(
        createInboundPage.createStep.descriptionField.textbox
      ).toHaveValue(DESCRIPTION);
      await expect(
        createInboundPage.createStep.originSelect.selectField
      ).toContainText(ORIGIN.name);
      await expect(
        createInboundPage.createStep.destinationSelect.selectField
      ).toContainText(CURRENT_LOCATION.name);
      await expect(
        createInboundPage.createStep.requestedBySelect.selectField
      ).toContainText(USER.name);
      await expect(
        createInboundPage.createStep.dateRequestedDatePicker.textbox
      ).toHaveValue(formatDate(TODAY));
    });

    await test.step('Go next step (Add items)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Add items');
    });

    await test.step('Add line items (Add items)', async () => {
      for (let i = 0; i < ROWS.length; i++) {
        const data = ROWS[i];
        const row = createInboundPage.addItemsStep.table.row(i);
        await row.productSelect.findAndSelectOption(data.productName);
        await row.quantityField.numberbox.fill(data.quantity);
        await row.lotField.textbox.fill(data.lotNumber);
        await row.recipientSelect.findAndSelectOption(data.recipient);

        await createInboundPage.addItemsStep.addLineButton.click();
      }
    });

    await test.step('Go to next step (Send)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Fill shipment fields (Send)', async () => {
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.trackingNumberField.textbox.fill(
        TRACKING_NUMBER
      );
      await createInboundPage.sendStep.driverNameField.textbox.fill(
        DRIVER_NAME
      );
      await createInboundPage.sendStep.commentField.textbox.fill(COMMENT);
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
    });

    await test.step('Go previous step (Add items)', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Add items');
    });

    await test.step('Assert line items (Add items)', async () => {
      for (let i = 0; i < ROWS.length; i++) {
        const data = ROWS[i];
        const row = createInboundPage.addItemsStep.table.row(i);
        await expect(row.productSelect.selectField).toContainText(
          data.productName
        );
        await expect(row.lotField.textbox).toHaveValue(data.lotNumber);
        await expect(row.quantityField.numberbox).toHaveValue(data.quantity);
        await expect(row.recipientSelect.selectField).toContainText(
          data.recipient
        );
      }
    });

    await test.step('Go to next step (Send)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Assert data on send step', async () => {
      await expect(createInboundPage.sendStep.originField.textbox).toHaveValue(
        ORIGIN.name
      );
      await expect(
        createInboundPage.sendStep.destinationSelect.selectField
      ).toContainText(CURRENT_LOCATION.name);
      await expect(
        createInboundPage.sendStep.shipmentTypeSelect.selectField
      ).toContainText(SHIPMENT_TYPE);
      await expect(
        createInboundPage.sendStep.trackingNumberField.textbox
      ).toHaveValue(TRACKING_NUMBER);
      await expect(
        createInboundPage.sendStep.driverNameField.textbox
      ).toHaveValue(DRIVER_NAME);
      await expect(createInboundPage.sendStep.commentField.textbox).toHaveValue(
        COMMENT
      );
      await expect(
        createInboundPage.sendStep.expectedDeliveryDatePicker.textbox
      ).toHaveValue(formatDate(EXPECTED_DELIVERY_DATE));

      for (let i = 0; i < ROWS.length; i++) {
        const data = ROWS[i];
        const row = createInboundPage.sendStep.table.row(i);
        await expect(row.productCode.field).toContainText(data.productCode);
        await expect(row.lotNumber.field).toContainText(data.lotNumber);
        await expect(row.quantityPicked.field).toContainText(data.quantity);
        await expect(row.recipient.field).toContainText(data.recipient);
      }
    });
  });
});
