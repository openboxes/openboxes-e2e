import GenericService from '@/api/GenericService';
import StockMovementService from '@/api/StockMovementService';
import { expect, test } from '@/fixtures/fixtures';
import {
  AddItemsTableRow,
  LocationResponse,
  StockMovementResponse,
} from '@/types';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
import LocationData from '@/utils/LocationData';
import ProductData from '@/utils/ProductData';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Create Inbound Stock Movement', () => {
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

    const prodOne = new ProductData('productOne', page.request);
    const prodTwo = new ProductData('productTwo', page.request);

    const genericService = new GenericService(page.request);

    const {
      data: { user },
    } = await genericService.getAppContext();

    CURRENT_LOCATION = await mainLocation.getLocation();
    ORIGIN = await supplierLocation.getLocation();

    const PRODUCT_ONE = await prodOne.getProduct();
    const PRODUCT_TWO = await prodTwo.getProduct();

    REQUESTOR = user.name;

    ROWS = [
      {
        packLevel1: 'test-pallet',
        packLevel2: 'test-box',
        productCode: PRODUCT_ONE.productCode,
        productName: PRODUCT_ONE.name,
        quantity: '12',
        lotNumber: 'E2E-lot-test',
        recipient: user.name,
        expirationDate: getDateByOffset(new Date(), 3),
      },
      {
        packLevel1: 'test-pallet',
        packLevel2: 'test-box',
        productCode: PRODUCT_TWO.productCode,
        productName: PRODUCT_TWO.name,
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
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Create Stock Movement step', async () => {
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        REQUESTOR
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
        `${formatDate(new Date(), 'DD/MMM/YYYY')} by ${REQUESTOR}`
      );
    });
  });

  test('Create Inbound stock movement field validations', async ({
    createInboundPage,
  }) => {
    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Trigger field validation (Create step)', async () => {
      await createInboundPage.createStep.descriptionField.textbox.blur();
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
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
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
    const rowData = ROWS[0];

    await test.step('Fill single required field (Add Items)', async () => {
      await row.productSelect.findAndSelectOption(rowData.productName);
      await expect(createInboundPage.nextButton).toBeDisabled();
    });

    await test.step('Fill all required fields (Add Items)', async () => {
      await row.quantityField.numberbox.fill(rowData.quantity);
      await expect(createInboundPage.nextButton).toBeEnabled();
    });

    await test.step('Fill in pack level 2 without pack level 1 (Add Items)', async () => {
      await row.packLevel2Field.textbox.fill(rowData.packLevel2);
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
      await row.packLevel1Field.textbox.fill(rowData.packLevel1);
      await row.packLevel2Field.assertHasNoError();
    });

    await test.step('Fill expiration date without lot (Add Items)', async () => {
      await row.expirationDate.fill(rowData.expirationDate);
      await row.expirationDate.textbox.blur();
      await createInboundPage.nextButton.click();
    });

    await test.step('Assert lot filed errors (Add Items)', async () => {
      await row.lotField.assertHasError();
      await row.lotField.textbox.hover();
      await expect(row.lotField.tooltip).toContainText(
        'Items with an expiry date must also have a lot number.'
      );
    });

    await test.step('Fill lot number (Add Items)', async () => {
      await row.lotField.textbox.fill(rowData.lotNumber);
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
        await createInboundPage.createStep.isLoaded();
      });

      await test.step('Create Stock Movement step', async () => {
        await createInboundPage.createStep.originSelect.findAndSelectOption(
          ORIGIN.name
        );
        await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
          REQUESTOR
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
        await expect(
          createInboundPage.sendStep.originField.textbox
        ).toHaveValue(ORIGIN.name);
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
        await expect(
          createInboundPage.sendStep.commentField.textbox
        ).toHaveValue(COMMENT);
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
        await row.productSelect.findAndSelectOption(rowData.productName);
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
        await createInboundPage.addItemsStep.addLineButton.click({
          delay: 300,
        });
        await createInboundPage.addItemsStep.addLineButton.click({
          delay: 300,
        });
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
        await row.productSelect.findAndSelectOption(rowData.productName);
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
          rowData.productName
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
      depotLocation,
    }) => {
      const OTHER_LOCATION = await depotLocation.getLocation();

      await test.step('Add items step', async () => {
        const rowData = ROWS[0];
        const row = createInboundPage.addItemsStep.table.row(0);
        await row.productSelect.findAndSelectOption(rowData.productName);
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
          .getOrganization(OTHER_LOCATION.organization?.name as string)
          .click();
        await locationChooser.getLocation(OTHER_LOCATION.name).click();
      });

      await test.step('Assert user should stay on same page without being redirected', async () => {
        await expect(navbar.locationChooserButton).toContainText(
          OTHER_LOCATION.name
        );
        await stockMovementShowPage.isLoaded();
      });
    });
  });
});

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


  // test('Use "Origin" filter', async ({ page }) => {
  //   //
  // });

  // test('"Destination" filter should be disabled', async ({ page }) => {
  //   //
  // });

  // test('Use "Shipment Type" filter', async ({ page }) => {
  //   //
  // });

  // test('Use "Created By" filter', async ({ page }) => {
  //   //
  // });

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
