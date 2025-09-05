import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';

const TODAY = getToday();
let ROW: AddItemsTableRow;
let INBOUND_ID: string;

test.beforeEach(
  async ({
    productService,
    mainUserService,
    createInboundPage,
    supplierLocationService,
  }) => {
    const PRODUCT_ONE = await productService.getProduct();
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

test('Check Pack level column visiblity on send page table', async ({
  createInboundPage,
}) => {
  await test.step('Fill in add items fields without pack levels', async () => {
    const row = createInboundPage.addItemsStep.table.row(0);
    await row.productSelect.findAndSelectOption(ROW.productName);
    await row.quantityField.numberbox.fill(ROW.quantity);
  });

  await test.step('Go next step (Send)', async () => {
    await createInboundPage.nextButton.click();
  });

  await test.step('Assert that pack level columns are not visible ons end page', async () => {
    const row = createInboundPage.sendStep.table.row(0);
    await expect(row.productCode.field).toContainText(ROW.productCode);
    await expect(row.quantityPicked.field).toContainText(ROW.quantity);
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
      .packLevel1Field.textbox.fill(ROW.packLevel1);
  });

  await test.step('Go next step (Send)', async () => {
    await createInboundPage.nextButton.click();
  });

  await test.step('Assert that pack level 1 columns is visible on send page after update', async () => {
    const row = createInboundPage.sendStep.table.row(0);
    await expect(row.productCode.field).toContainText(ROW.productCode);
    await expect(row.quantityPicked.field).toContainText(ROW.quantity);
    await expect(row.packLevel1.field).toContainText(ROW.packLevel1);
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
      .packLevel2Field.textbox.fill(ROW.packLevel2);
  });

  await test.step('Go next step (Send)', async () => {
    await createInboundPage.nextButton.click();
  });

  await test.step('Assert that both pack level columns are visible on send page after update', async () => {
    const row = createInboundPage.sendStep.table.row(0);
    await expect(row.productCode.field).toContainText(ROW.productCode);
    await expect(row.quantityPicked.field).toContainText(ROW.quantity);
    await expect(row.packLevel1.field).toContainText(ROW.packLevel1);
    await expect(row.packLevel2.field).toContainText(ROW.packLevel2);
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
    await expect(row.productCode.field).toContainText(ROW.productCode);
    await expect(row.quantityPicked.field).toContainText(ROW.quantity);
    await expect(row.packLevel1.field).toBeHidden();
    await expect(row.packLevel2.field).toBeHidden();
  });
});
