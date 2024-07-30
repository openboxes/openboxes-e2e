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

test('Use Control+ArrowDown copy cell shortcut', async ({
  page,
  createInboundPage,
}) => {
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
      .packLevel1Field.textbox.fill(ROW.packLevel1);
    await page.keyboard.press('Control+ArrowDown');
    await page.keyboard.press('Control+ArrowDown');

    await expect(
      createInboundPage.addItemsStep.table.row(0).packLevel1Field.textbox
    ).toHaveValue(ROW.packLevel1);
    await expect(
      createInboundPage.addItemsStep.table.row(1).packLevel1Field.textbox
    ).toHaveValue(ROW.packLevel1);
    await expect(
      createInboundPage.addItemsStep.table.row(2).packLevel1Field.textbox
    ).toHaveValue(ROW.packLevel1);
  });

  await test.step('Use Control+ArrowDown copy cell shortcut on Pack Level 2', async () => {
    await createInboundPage.addItemsStep.table
      .row(0)
      .packLevel2Field.textbox.fill(ROW.packLevel2);
    await page.keyboard.press('Control+ArrowDown');
    await page.keyboard.press('Control+ArrowDown');

    await expect(
      createInboundPage.addItemsStep.table.row(0).packLevel2Field.textbox
    ).toHaveValue(ROW.packLevel2);
    await expect(
      createInboundPage.addItemsStep.table.row(1).packLevel2Field.textbox
    ).toHaveValue(ROW.packLevel2);
    await expect(
      createInboundPage.addItemsStep.table.row(2).packLevel2Field.textbox
    ).toHaveValue(ROW.packLevel2);
  });

  await test.step('Use Control+ArrowDown copy cell shortcut on Lot Number', async () => {
    await createInboundPage.addItemsStep.table
      .row(0)
      .lotField.textbox.fill(ROW.lotNumber);
    await page.keyboard.press('Control+ArrowDown');
    await page.keyboard.press('Control+ArrowDown');

    await expect(
      createInboundPage.addItemsStep.table.row(0).lotField.textbox
    ).toHaveValue(ROW.lotNumber);
    await expect(
      createInboundPage.addItemsStep.table.row(1).lotField.textbox
    ).toHaveValue(ROW.lotNumber);
    await expect(
      createInboundPage.addItemsStep.table.row(2).lotField.textbox
    ).toHaveValue(ROW.lotNumber);
  });

  await test.step('Use Control+ArrowDown copy cell shortcut on Quantity', async () => {
    await createInboundPage.addItemsStep.table
      .row(0)
      .quantityField.numberbox.fill(ROW.quantity);
    await page.keyboard.press('Control+ArrowDown');
    await page.keyboard.press('Control+ArrowDown');

    await expect(
      createInboundPage.addItemsStep.table.row(0).quantityField.numberbox
    ).toHaveValue(ROW.quantity);
    await expect(
      createInboundPage.addItemsStep.table.row(1).quantityField.numberbox
    ).toHaveValue(ROW.quantity);
    await expect(
      createInboundPage.addItemsStep.table.row(2).quantityField.numberbox
    ).toHaveValue(ROW.quantity);
  });
});