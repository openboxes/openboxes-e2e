import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';

const TODAY = getToday();
let ROW: AddItemsTableRow;
let INBOUND_ID: string;

test.beforeEach(
  async ({
    mainProductService,
    mainUserService,
    createInboundPage,
    supplierLocationService,
  }) => {
    const PRODUCT_ONE = await mainProductService.getProduct();
    const USER = await mainUserService.getUser();
    const ORIGIN = await supplierLocationService.getLocation();
    const DESCRIPTION = 'some description';

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

test('Save and exit stock movement on add items step', async ({
  stockMovementShowPage,
  createInboundPage,
}) => {
  const UPDATED_QUANTITY = '3';

  await test.step('Add items step', async () => {
    const row = createInboundPage.addItemsStep.table.row(0);
    await row.productSelect.findAndSelectOption(ROW.productName);
    await row.quantityField.numberbox.fill(ROW.quantity);
    await row.lotField.textbox.fill(ROW.lotNumber);
    await row.recipientSelect.findAndSelectOption(ROW.recipient);
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
      ROW.productName
    );
    await expect(row.lotField.textbox).toHaveValue(ROW.lotNumber);
    await expect(row.quantityField.numberbox).toHaveValue(ROW.quantity);
    await expect(row.recipientSelect.selectField).toContainText(
      ROW.recipient
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