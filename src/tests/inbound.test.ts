import GenericService from '@/api/GenericService';
import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow, LocationResponse } from '@/types';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
import LocationData from '@/utils/LocationData';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

// CREATE STEP DATA
let REQUESTOR: string;
const DESCRIPTION = 'some description';
const TODAY = new Date();
let CURRENT_LOCATION: LocationResponse;
let ORIGIN: LocationResponse;

// ADD ITEMS STEP DATA
let ROWS: AddItemsTableRow[] = [];

// SEND STEP DATA
const TRACKING_NUMBER = 'E2E-NUMBER-12345';
const DRIVER_NAME = 'Test-Name Test-Lastname';
const COMMENT = 'Test Comment';
const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
const SHIPMENT_TYPE = 'Land';

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();

  const mainLocation = new LocationData('main', page.request);
  const supplierLocation = new LocationData('supplier', page.request);
  const genericService = new GenericService(page.request);

  const {
    data: { user },
  } = await genericService.getAppContext();

  CURRENT_LOCATION = await mainLocation.getLocation();
  ORIGIN = await supplierLocation.getLocation();

  REQUESTOR = user.name;

  ROWS = [
    {
      packLevel1: 'test-pallet',
      packLevel2: 'test-box',
      productCode: '10001',
      quantity: '12',
      lotNumber: 'E2E-lot-test',
      recipient: user.name,
      expirationDate: getDateByOffset(new Date(), 3),
    },
    {
      packLevel1: 'test-pallet',
      packLevel2: 'test-box',
      productCode: '10002',
      quantity: '12',
      lotNumber: 'E2E-lot-test',
      recipient: user.name,
      expirationDate: getDateByOffset(new Date(), 3),
    },
  ];

  await page.close();
});

test('Create and send inbound stock movement', async ({
  createInboundPage,
  stockMovementShowPage,
}) => {
  await test.step('Go to create inbound page', async () => {
    await createInboundPage.goToPage();
    await createInboundPage.wizzardSteps.assertActiveStep('Create');
  });

  await test.step('Create Stock Movement step', async () => {
    await createInboundPage.createStep.descriptionField.textbox.fill(
      DESCRIPTION
    );
    await createInboundPage.createStep.originSelect.findAndSelectOption(
      ORIGIN.name
    );
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
  });

  await test.step('Go next step (Add items)', async () => {
    await createInboundPage.nextButton.click();
    await createInboundPage.addItemsStep.isLoaded();
  });

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
    await row.productSelect.findAndSelectOption(data.productCode);
    await row.quantityField.numberbox.fill(data.quantity);
    await row.lotField.textbox.fill(data.lotNumber);
    await row.recipientSelect.findAndSelectOption(data.recipient);

    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
  });

  await test.step('Add second line item (Add items)', async () => {
    await createInboundPage.addItemsStep.addLineButton.click();

    const data = ROWS[1];
    const row = createInboundPage.addItemsStep.table.row(1);
    await row.productSelect.findAndSelectOption(data.productCode);
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
    await createInboundPage.sendStep.driverNameField.textbox.fill(DRIVER_NAME);
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
    ).toContainText(`${formatDate(new Date(), 'DD/MMM/YYYY')} by ${REQUESTOR}`);
  });
});

test('Create Inbound stock movement field validations', async ({ createInboundPage }) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();

  const ROW = {
    packLevel1: 'pallet',
    packLevel2: 'box',
    productCode: '10001',
    quantity: '12',
    lotNumber: 'test123',
    recipient: 'dare',
    expirationDate: getDateByOffset(new Date(), 3),
  };

  await test.step('Go to create inbound page', async () => {
    await createInboundPage.goToPage();
  });

  await test.step('Trigger field validation (Create step)', async () => {
    await createInboundPage.createStep.isLoaded();
    await createInboundPage.wizzardSteps.assertActiveStep('Create');
    await createInboundPage.nextButton.focus();
    await createInboundPage.nextButton.click();
  });

  await test.step('Assert field validation on Description field (Create step)', async () => {
    await createInboundPage.createStep.descriptionField.assertHasError();
    await expect(
      createInboundPage.createStep.descriptionField.errorMessage
    ).toContainText('This field is required');
  });

  await test.step('Assert field validation on Origin field (Create step)', async () => {
    await createInboundPage.createStep.originSelect.assertHasError();
    await expect(
      createInboundPage.createStep.originSelect.errorMessage
    ).toContainText('This field is required');
  });

  await test.step('Assert no field validation on Destination field (Create step)', async () => {
    await createInboundPage.createStep.destinationSelect.assertHasNoError();
  });

  await test.step('Assert field validation on Requested By field (Create step)', async () => {
    await createInboundPage.createStep.requestedBySelect.assertHasError();
    await expect(
      createInboundPage.createStep.requestedBySelect.errorMessage
    ).toContainText('This field is required');
  });

  await test.step('Assert no field validation on Stock field (Create step)', async () => {
    await createInboundPage.createStep.stocklistSelect.assertHasNoError();
  });

  await test.step('Assert field validation on Date Requested field (Create step)', async () => {
    await createInboundPage.createStep.dateRequestedDatePicker.assertHasError();
    await expect(
      createInboundPage.createStep.dateRequestedDatePicker.errorMessage
    ).toContainText('This field is required');
  });

  await test.step('Fill all required field on create step (Create step)', async () => {
    await createInboundPage.createStep.descriptionField.textbox.fill(
      DESCRIPTION
    );
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
  });

  await test.step('Go to next step (Create -> Add Items)', async () => {
    await createInboundPage.nextButton.click();
  });

  await test.step('Assert next button should be disabled on empty table (Add Items)', async () => {
    await expect(createInboundPage.nextButton).toBeDisabled();
  });

  const row = createInboundPage.addItemsStep.table.row(0);

  await test.step('Fill single required field (Add Items)', async () => {
    await row.productSelect.findAndSelectOption(ROW.productCode);
    await expect(createInboundPage.nextButton).toBeDisabled();
  });

  await test.step('Fill all required fields (Add Items)', async () => {
    await row.quantityField.numberbox.fill(ROW.quantity);
    await expect(createInboundPage.nextButton).toBeEnabled();
  });

  await test.step('Fill in pack level 2 without pack level 1 (Add Items)', async () => {
    await row.packLevel2Field.textbox.fill(ROW.packLevel2);
    await row.packLevel2Field.textbox.blur();
  });

  await test.step('Assert pack level 2 error (Add Items)', async () => {
    await row.packLevel2Field.assertHasError();
    await row.packLevel2Field.textbox.hover();
    await expect(row.packLevel2Field.tooltip).toContainText(
      'Please enter Pack level 1 before Pack level 2.'
    );
  });

  await test.step('Fill pack level 1 (Add Items)', async () => {
    await row.packLevel1Field.textbox.fill(ROW.packLevel1);
    await row.packLevel2Field.assertHasNoError();
  });

  await test.step('Fill expiration date without lot (Add Items)', async () => {
    await row.expirationDate.fill(ROW.expirationDate);
    await row.expirationDate.textbox.blur();
    await createInboundPage.nextButton.click();
  });

  await test.step('Assert lot filed errors (Add Items)', async () => {
    await row.lotField.assertHasError();
    await row.lotField.textbox.hover();
    await expect(row.packLevel2Field.tooltip).toContainText(
      'Items with an expiry date must also have a lot number.'
    );
  });

  await test.step('Fill lot number (Add Items)', async () => {
    await row.lotField.textbox.fill(ROW.lotNumber);
    await row.packLevel2Field.assertHasNoError();
  });

  await test.step('Go to next step (Add Items -> Send)', async () => {
    await createInboundPage.nextButton.click();
  });

  await test.step('Expected delivery date should be empty', async () => {
    await expect(
      createInboundPage.sendStep.expectedDeliveryDatePicker.textbox
    ).toHaveValue('');
  });

  await test.step('Send shipment', async () => {
    await createInboundPage.sendStep.sendShipmentButton.click();
  });

  await test.step('Expected delivery date field shoudl have validation error', async () => {
    await createInboundPage.sendStep.expectedDeliveryDatePicker.assertHasError();
    await expect(
      createInboundPage.sendStep.expectedDeliveryDatePicker.errorMessage
    ).toContainText('This field is required');
  });

  await test.step('Fill expected delivery date one day before ship date', async () => {
    await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
      getDateByOffset(new Date(), -1)
    );
  });

  await test.step('Assert field validation errors on Ship date and Expeted delivery date fields', async () => {
    await createInboundPage.sendStep.shipDateDatePicker.assertHasError();
    await expect(
      createInboundPage.sendStep.shipDateDatePicker.errorMessage
    ).toContainText(
      'Please verify timeline. Delivery date cannot be before Ship date.'
    );

    await createInboundPage.sendStep.expectedDeliveryDatePicker.assertHasError();
    await expect(
      createInboundPage.sendStep.expectedDeliveryDatePicker.errorMessage
    ).toContainText(
      'Please verify timeline. Delivery date cannot be before Ship date.'
    );
  });
});

test.describe('Create stock movement', () => {
  test.beforeEach(async ({ createInboundPage }) => {
    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Create Stock Movement step', async () => {
      await createInboundPage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        REQUESTOR
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
    });

    await test.step('Go next step (Add items)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Add items');
    });
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
      ).toContainText(REQUESTOR);
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
        await row.productSelect.findAndSelectOption(data.productCode);
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
          data.productCode
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

  test('Check Pack level column visiblity on send page table', async ({
    createInboundPage,
  }) => {
    const rowData = ROWS[0];

    await test.step('Fill in add items fields without pack levels', async () => {
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(rowData.productCode);
      await row.quantityField.numberbox.fill(rowData.quantity);
    });

    await test.step('Go next step (Send)', async () => {
      await createInboundPage.nextButton.click();
    });

    await test.step('Assert that pack level columns are not visible ons end page', async () => {
      const row = createInboundPage.sendStep.table.row(0);
      await expect(row.productCode.field).toContainText(rowData.productCode);
      await expect(row.quantityPicked.field).toContainText(rowData.quantity);
      await expect(row.packLevel1.field).toBeHidden();
      await expect(row.packLevel2.field).toBeHidden();
    });

    await test.step('Go back (Add items)', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.confirmButton.click();
    });

    await test.step('Fill in Pack Level 1 on first row', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel1Field.textbox.fill(rowData.packLevel1);
    });

    await test.step('Go next step (Send)', async () => {
      await createInboundPage.nextButton.click();
    });

    await test.step('Assert that pack level 1 columns is visible on send page after update', async () => {
      const row = createInboundPage.sendStep.table.row(0);
      await expect(row.productCode.field).toContainText(rowData.productCode);
      await expect(row.quantityPicked.field).toContainText(rowData.quantity);
      await expect(row.packLevel1.field).toContainText(rowData.packLevel1);
      await expect(row.packLevel2.field).toBeHidden();
    });

    await test.step('Go back (Add items)', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.confirmButton.click();
    });

    await test.step('Fill in Pack Level 2 on first row', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel2Field.textbox.fill(rowData.packLevel2);
    });

    await test.step('Go next step (Send)', async () => {
      await createInboundPage.nextButton.click();
    });

    await test.step('Assert that both pack level columns are visible on send page after update', async () => {
      const row = createInboundPage.sendStep.table.row(0);
      await expect(row.productCode.field).toContainText(rowData.productCode);
      await expect(row.quantityPicked.field).toContainText(rowData.quantity);
      await expect(row.packLevel1.field).toContainText(rowData.packLevel1);
      await expect(row.packLevel2.field).toContainText(rowData.packLevel2);
    });

    await test.step('Go back (Add items)', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.confirmButton.click();
    });

    await test.step('Fill in Pack Level 2 on first row', async () => {
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.packLevel2Field.textbox.fill('');
      await row.packLevel1Field.textbox.fill('');
    });

    await test.step('Go next step (Send)', async () => {
      await createInboundPage.nextButton.click();
    });

    await test.step('Assert that both pack level columns are visible on send page after update', async () => {
      const row = createInboundPage.sendStep.table.row(0);
      await expect(row.productCode.field).toContainText(rowData.productCode);
      await expect(row.quantityPicked.field).toContainText(rowData.quantity);
      await expect(row.packLevel1.field).toBeHidden();
      await expect(row.packLevel2.field).toBeHidden();
    });
  });

  test('Use Control+ArrowDown copy cell shortcut', async ({
    page,
    createInboundPage,
  }) => {
    const rowData = ROWS[0];

    await test.step('Add additional rows', async () => {
      await createInboundPage.addItemsStep.addLineButton.click({ delay: 300 });
      await createInboundPage.addItemsStep.addLineButton.click({ delay: 300 });
    });

    await test.step('Use Control+ArrowDown copy cell shortcut on Pack Level 1', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel1Field.textbox.fill(rowData.packLevel1);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).packLevel1Field.textbox
      ).toHaveValue(rowData.packLevel1);
      await expect(
        createInboundPage.addItemsStep.table.row(1).packLevel1Field.textbox
      ).toHaveValue(rowData.packLevel1);
      await expect(
        createInboundPage.addItemsStep.table.row(2).packLevel1Field.textbox
      ).toHaveValue(rowData.packLevel1);
    });

    await test.step('Use Control+ArrowDown copy cell shortcut on Pack Level 2', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel2Field.textbox.fill(rowData.packLevel2);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).packLevel2Field.textbox
      ).toHaveValue(rowData.packLevel2);
      await expect(
        createInboundPage.addItemsStep.table.row(1).packLevel2Field.textbox
      ).toHaveValue(rowData.packLevel2);
      await expect(
        createInboundPage.addItemsStep.table.row(2).packLevel2Field.textbox
      ).toHaveValue(rowData.packLevel2);
    });

    await test.step('Use Control+ArrowDown copy cell shortcut on Lot Number', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .lotField.textbox.fill(rowData.lotNumber);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).lotField.textbox
      ).toHaveValue(rowData.lotNumber);
      await expect(
        createInboundPage.addItemsStep.table.row(1).lotField.textbox
      ).toHaveValue(rowData.lotNumber);
      await expect(
        createInboundPage.addItemsStep.table.row(2).lotField.textbox
      ).toHaveValue(rowData.lotNumber);
    });

    await test.step('Use Control+ArrowDown copy cell shortcut on Quantity', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .quantityField.numberbox.fill(rowData.quantity);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).quantityField.numberbox
      ).toHaveValue(rowData.quantity);
      await expect(
        createInboundPage.addItemsStep.table.row(1).quantityField.numberbox
      ).toHaveValue(rowData.quantity);
      await expect(
        createInboundPage.addItemsStep.table.row(2).quantityField.numberbox
      ).toHaveValue(rowData.quantity);
    });
  });

  test('Save and exit stock movement on add items step', async ({
    stockMovementShowPage,
    createInboundPage,
  }) => {
    const rowData = ROWS[0];
    const UPDATED_QUANTITY = '3';

    await test.step('Add items step', async () => {
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(rowData.productCode);
      await row.quantityField.numberbox.fill(rowData.quantity);
      await row.lotField.textbox.fill(rowData.lotNumber);
      await row.recipientSelect.findAndSelectOption(rowData.recipient);
    });

    await test.step('Save and exit', async () => {
      await createInboundPage.addItemsStep.saveAndExitButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await expect(stockMovementShowPage.statusTag).toBeVisible();
    await expect(
      stockMovementShowPage.auditingTable.dateShippedRow
    ).toContainText('None');
    await expect(
      stockMovementShowPage.auditingTable.dateReceivedRow
    ).toContainText('None');

    await test.step('Go back to edit page', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    await test.step('Assert table items', async () => {
      const row = createInboundPage.addItemsStep.table.row(0);
      await expect(row.productSelect.selectField).toContainText(
        rowData.productCode
      );
      await expect(row.lotField.textbox).toHaveValue(rowData.lotNumber);
      await expect(row.quantityField.numberbox).toHaveValue(rowData.quantity);
      await expect(row.recipientSelect.selectField).toContainText(
        rowData.recipient
      );
    });

    await test.step('Update row with different quantity', async () => {
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.quantityField.numberbox.fill(UPDATED_QUANTITY);
    });

    await test.step('save and exit', async () => {
      await createInboundPage.addItemsStep.saveAndExitButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go back to edit inbound', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    await test.step('Assert table items with updated quantity value', async () => {
      const row = createInboundPage.addItemsStep.table.row(0);
      await expect(row.quantityField.numberbox).toHaveValue(UPDATED_QUANTITY);
    });
  });

  test('Switch location on stock movement show page', async ({
    stockMovementShowPage,
    createInboundPage,
    locationChooser,
    navbar,
    createLocationPage,
  }) => {
    const uniqueIdentifier = new UniqueIdentifier();

    const OTHER_LOCATION_NAME = uniqueIdentifier.generateUniqueString(
      'Other depot location'
    );
    const OTHER_LOCATION_ORGANIZATION = CURRENT_LOCATION.organization
      ?.name as string;

    await test.step('Create other depot location', async () => {
      await createLocationPage.gotToPage();
      await createLocationPage.locationDetailsTabSection.locationNameField.fill(
        OTHER_LOCATION_NAME
      );
      await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getlocationTypeOption('Depot')
        .click();

      await createLocationPage.locationDetailsTabSection.organizationSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getOrganization(OTHER_LOCATION_ORGANIZATION)
        .click();

      await createLocationPage.locationDetailsTabSection.saveButton.click();
    });

    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
    });

    await test.step('Create Stock Movement step', async () => {
      await createInboundPage.createStep.isLoaded();

      await expect(
        createInboundPage.createStep.destinationSelect.selectField
      ).toContainText(CURRENT_LOCATION.name);

      await createInboundPage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        REQUESTOR
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
    });

    await test.step('Go to next page', async () => {
      await createInboundPage.nextButton.click();
    });

    await test.step('Add items step', async () => {
      const rowData = ROWS[0];
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(rowData.productCode);
      await row.quantityField.numberbox.fill(rowData.quantity);
      await row.lotField.textbox.fill(rowData.lotNumber);
      await row.recipientSelect.findAndSelectOption(rowData.recipient);
    });

    await test.step('Save and exit', async () => {
      await createInboundPage.addItemsStep.saveAndExitButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('switch locations', async () => {
      await expect(navbar.locationChooserButton).toContainText(
        CURRENT_LOCATION.name
      );

      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(OTHER_LOCATION_ORGANIZATION)
        .click();
      await locationChooser.getLocation(OTHER_LOCATION_NAME).click();
    });

    await test.step('Assert user should stay on same page without being redirected', async () => {
      await expect(navbar.locationChooserButton).toContainText(
        OTHER_LOCATION_NAME
      );
      await stockMovementShowPage.isLoaded();
    });
  });
});
