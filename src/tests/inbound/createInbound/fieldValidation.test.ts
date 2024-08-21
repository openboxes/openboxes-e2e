import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow, LocationResponse, User } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';

const TODAY = getToday();
let ROW: AddItemsTableRow;
let INBOUND_ID: string;
const DESCRIPTION = 'some description';
let USER: User;
let ORIGIN: LocationResponse;

test.beforeEach(
  async ({
    mainProductService,
    mainUserService,
    createInboundPage,
    supplierLocationService,
  }) => {
    const PRODUCT_ONE = await mainProductService.getProduct();
    USER = await mainUserService.getUser();
    ORIGIN = await supplierLocationService.getLocation();

    ROW = {
      packLevel1: 'test-pallet',
      packLevel2: 'test-box',
      productCode: PRODUCT_ONE.productCode,
      productName: PRODUCT_ONE.name,
      quantity: '12',
      lotNumber: 'E2E-lot-test',
      recipient: USER.name,
      expirationDate: getDateByOffset(TODAY, 3),
    };

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
      USER.name
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
    await row.productSelect.findAndSelectOption(ROW.productName);
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
    await expect(row.lotField.tooltip).toContainText(
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
