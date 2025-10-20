import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow, LocationResponse } from '@/types';
import { formatDate, getDateByOffset, getToday } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Select person in requested by', () => {
  const TODAY = getToday();
  let ROWS: AddItemsTableRow[];
  let INBOUND_ID: string;
  const DESCRIPTION = 'some description';
  let ORIGIN: LocationResponse;
  const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
  const SHIPMENT_TYPE = 'Land';
  const uniqueIdentifier = new UniqueIdentifier();
  const personFirstName = uniqueIdentifier.generateUniqueString('person');
  const personLastName = uniqueIdentifier.generateUniqueString('lastname');
  const person = `${personFirstName} ${personLastName}`;

  test.beforeEach(
    async ({
      mainProductService,
      supplierLocationService,
      page,
      personsListPage,
      createPersonPage,
    }) => {
      const PRODUCT_ONE = await mainProductService.getProduct();
      ORIGIN = await supplierLocationService.getLocation();

      ROWS = [
        {
          packLevel1: 'test-pallet',
          packLevel2: 'test-box',
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
          quantity: '12',
          lotNumber: 'E2E-lot-test',
          recipient: person,
          expirationDate: getDateByOffset(new Date(), 3),
        },
      ];

      await test.step('Create person', async () => {
        await page.goto('./person/list');
        await personsListPage.isLoaded();
        await personsListPage.addPersonButton.click();
        await createPersonPage.firstNameField.fill(personFirstName);
        await createPersonPage.lastNameField.fill(personLastName);
        await createPersonPage.createPersonButton.click();
        await personsListPage.isLoaded();
      });
    }
  );

  test.afterEach(
    async ({
      stockMovementService,
      stockMovementShowPage,
      page,
      personsListPage,
      createPersonPage,
    }) => {
      await stockMovementShowPage.rollbackButton.click();
      await stockMovementService.deleteStockMovement(INBOUND_ID);
      await page.goto('./person/list');
      await personsListPage.isLoaded();
      await personsListPage.searchField.fill(personFirstName);
      await personsListPage.findButton.click();
      await personsListPage.getPersonToEdit(person).click();
      await createPersonPage.deletePersonButton.click();
    }
  );

  test('Select person in requested by', async ({
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
        person
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

    await test.step('Add first line items (Add items), add person as recipient', async () => {
      const data = ROWS[0];
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.recipientSelect.findAndSelectOption(person);
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

    await test.step('Assert requested by and recipient on sm show page', async () => {
      await expect(
        stockMovementShowPage.auditingTable.dateRequestedRow
      ).toContainText(`${formatDate(new Date(), 'DD/MMM/YYYY')} by ${person}`);
      await expect(
        stockMovementShowPage.packingListTable.row(1).recipient
      ).toContainText(`${person}`);
    });
  });
});
