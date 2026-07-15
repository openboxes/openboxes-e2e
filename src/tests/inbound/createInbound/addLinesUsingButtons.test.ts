import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import { AddItemsTableRow, LocationResponse, User } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';

test.describe('Add lines using buttons and rollback from send page test', () => {
  const TODAY = getToday();
  let ROWS: AddItemsTableRow[];
  let INBOUND_ID: string;
  const DESCRIPTION = 'some description';
  let ORIGIN: LocationResponse;
  let USER: User;
  const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
  const SHIPMENT_TYPE = 'Land';

  test.beforeEach(
    async ({ productService, mainUserService, supplierLocationService }) => {
      const PRODUCT_ONE = await productService.getProduct(Product.ONE);
      const PRODUCT_TWO = await productService.getProduct(Product.TWO);
      const PRODUCT_THREE = await productService.getProduct(Product.THREE);
      USER = await mainUserService.getUser();
      ORIGIN = await supplierLocationService.getLocation();

      ROWS = [
        {
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
          quantity: '10',
          lotNumber: 'E2E-lot-test',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
          packLevel1: '',
          packLevel2: '',
        },
        {
          productCode: PRODUCT_TWO.productCode,
          productName: PRODUCT_TWO.name,
          quantity: '12',
          lotNumber: '',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
          packLevel1: '',
          packLevel2: '',
        },

        {
          productCode: PRODUCT_THREE.productCode,
          productName: PRODUCT_THREE.name,
          quantity: '15',
          lotNumber: '',
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
          packLevel1: '',
          packLevel2: '',
        },
      ];
    }
  );

  test.afterEach(async ({ stockMovementService, stockMovementShowPage }) => {
    await stockMovementShowPage.isLoaded();
    await stockMovementService.deleteStockMovement(INBOUND_ID);
  });

  test('Add lines using buttons and rollback from send page test', async ({
    createInboundPage,
    stockMovementShowPage,
    page,
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

    await test.step('Add first line items (Add items)', async () => {
      const data = ROWS[0];
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.recipientSelect.findAndSelectOption(data.recipient);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
    });

    await test.step('Add second line item using tab', async () => {
      await page.keyboard.press('Tab');
      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(2);

      const data = ROWS[1];
      const row = createInboundPage.addItemsStep.table.row(1);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.recipientSelect.findAndSelectOption(data.recipient);
    });

    await test.step('Add third line item using right arrow', async () => {
      await page.keyboard.press('ArrowRight');
      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(3);

      const data = ROWS[2];
      const row = createInboundPage.addItemsStep.table.row(2);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.recipientSelect.findAndSelectOption(data.recipient);
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
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
    });

    await test.step('Send shipment', async () => {
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Open send page for shipped inbound and assert ship date fied is disabled', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await expect(
        createInboundPage.sendStep.shipDateDatePicker.textbox
      ).toBeDisabled();
      await expect(
        createInboundPage.sendStep.sendShipmentButton
      ).toBeDisabled();
      await expect(
        createInboundPage.sendStep.getShipmentStatus('SHIPPED')
      ).toBeVisible();
      await expect(createInboundPage.sendStep.rollbackButton).toBeEnabled();
    });

    await test.step('Rollback shipment from send page', async () => {
      await createInboundPage.sendStep.rollbackButton.click();
      await createInboundPage.sendStep.isLoaded();
      await expect(
        createInboundPage.sendStep.shipDateDatePicker.textbox
      ).toBeEnabled();
      await expect(createInboundPage.sendStep.sendShipmentButton).toBeEnabled();
      await expect(
        createInboundPage.sendStep.getShipmentStatus('PENDING')
      ).toBeVisible();
      await expect(createInboundPage.sendStep.rollbackButton).toBeHidden();
    });

    await test.step('Save and exit from inbound and assert status on view page', async () => {
      await createInboundPage.sendStep.saveAndExitButton.click();
      await stockMovementShowPage.isLoaded();
      await expect(stockMovementShowPage.statusTag).toHaveText('Checking');
    });
  });
});
