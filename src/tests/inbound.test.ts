import { expect, test } from '@/fixtures/fixtures';
import { formatDate } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test('create step', async ({ createInboundPage, mainLocation }) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();
  const currentLocation = await mainLocation.getLocation();
  const ROW = {
    productCode: '10001',
    quantity: '12',
    lotNumber: 'test123',
    recipient: 'dare',
  };

  await createInboundPage.goToPage();

  await test.step('Create step', async () => {
    await createInboundPage.createStep.isLoaded();
    await createInboundPage.wizzardSteps.assertStepStatus('Create', true);

    await expect(
      createInboundPage.createStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);

    await createInboundPage.createStep.descriptionField.textbox.fill(
      DESCRIPTION
    );
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);

    await createInboundPage.nextButton.click();
  });

  await test.step('Add items step', async () => {
    await createInboundPage.wizzardSteps.assertStepStatus('Add items', true);
    await createInboundPage.assertHeaderIsVisible({
      origin: ORIGIN,
      destination: currentLocation.name,
      description: DESCRIPTION,
      date: formatDate(TODAY),
    });
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);

    // table with empty values shuld have disabled next button
    await expect(createInboundPage.previousButton).toBeEnabled();
    await expect(createInboundPage.nextButton).toBeDisabled();

    const row = createInboundPage.addItemsStep.table.row(0);

    await row.productSelect.findAndSelectOption(ROW.productCode);
    await row.quantityField.numberbox.fill(ROW.quantity);
    // next button should be enabled after filling all required fields
    await expect(createInboundPage.previousButton).toBeEnabled();
    await expect(createInboundPage.nextButton).toBeEnabled();
    await expect(createInboundPage.addItemsStep.saveButton).toBeEnabled();
    await expect(
      createInboundPage.addItemsStep.saveAndExitButton
    ).toBeEnabled();
    await expect(createInboundPage.addItemsStep.deleteAllButton).toBeEnabled();

    await row.lotField.textbox.fill(ROW.lotNumber);
    await row.recipientSelect.findAndSelectOption(ROW.recipient);

    await createInboundPage.addItemsStep.addLineButton.click();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(2);

    await createInboundPage.addItemsStep.table.row(1).deleteButton.click();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
  });

  // on send page check origin, destination, description field are same as on create step
  // Once shipment is send, Date Shipped in auditing should be filled with user who shipped it and the date
});

test('Assert that all values are persisted between going through workflow steps', async ({
  createInboundPage,
  mainLocation,
}) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();
  const currentLocation = await mainLocation.getLocation();
  const ROWS = [
    {
      productCode: '10001',
      quantity: '12',
      lotNumber: 'test123',
      recipient: 'dare',
    },
    {
      productCode: '10002',
      quantity: '12',
      lotNumber: 'test123',
      recipient: 'dare',
    },
  ];

  await createInboundPage.goToPage();

  await createInboundPage.wizzardSteps.assertActiveStep('Create');

  await test.step('Create Stock Movement step', async () => {
    await createInboundPage.createStep.descriptionField.textbox.fill(
      DESCRIPTION
    );
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
  });

  await test.step('Go to add items step', async () => {
    await createInboundPage.nextButton.click();
    await createInboundPage.addItemsStep.isLoaded();

    await createInboundPage.wizzardSteps.assertActiveStep('Add items');
  });

  await test.step('Fill in add items fields', async () => {
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

  await test.step('Go to send step', async () => {
    await createInboundPage.nextButton.click();

    await createInboundPage.wizzardSteps.assertActiveStep('Send');

    await createInboundPage.sendStep.isLoaded();
  });

  await test.step('Assert data on send step', async () => {
    await expect(createInboundPage.sendStep.originField.textbox).toHaveValue(
      ORIGIN
    );
    await expect(
      createInboundPage.sendStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);

    for (let i = 0; i < ROWS.length; i++) {
      const data = ROWS[i];
      const row = createInboundPage.sendStep.table.row(i);
      await expect(row.productCode.field).toContainText(data.productCode);
      await expect(row.lotNumber.field).toContainText(data.lotNumber);
      await expect(row.quantityPicked.field).toContainText(data.quantity);
      await expect(row.recipient.field).toContainText(data.recipient);
    }
  });

  await test.step('Go back to add items step', async () => {
    await createInboundPage.previousButton.click();
    await createInboundPage.sendStep.validationPopup.assertPopupVisible();
    await createInboundPage.sendStep.validationPopup.confirmButton.click();

    await createInboundPage.addItemsStep.isLoaded();

    await createInboundPage.wizzardSteps.assertActiveStep('Add items');
  });

  await test.step('assert data on add items step when going back', async () => {
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

  await test.step('Go back to create step', async () => {
    await createInboundPage.previousButton.click();

    await expect(
      createInboundPage.createStep.descriptionField.textbox
    ).toHaveValue(DESCRIPTION);
    await expect(
      createInboundPage.createStep.originSelect.selectField
    ).toContainText(ORIGIN);
    await expect(
      createInboundPage.createStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);
    await expect(
      createInboundPage.createStep.requestedBySelect.selectField
    ).toContainText(REQUESTOR);
    await expect(
      createInboundPage.createStep.dateRequestedDatePicker.textbox
    ).toHaveValue(formatDate(TODAY));
  });
});

test('Check Pack level column visiblity on send pagew table', async ({
  createInboundPage,
}) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();
  const ROW = {
    productCode: '10001',
    quantity: '12',
  };
  const PACK_LEVEL_1 = 'pallet_test';
  const PACK_LEVEL_2 = 'box_test';

  await test.step('Create stock movement', async () => {
    await createInboundPage.goToPage();

    await createInboundPage.createStep.descriptionField.textbox.fill(
      DESCRIPTION
    );
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
    await createInboundPage.nextButton.click();
  });

  await test.step('Fill in add items fields without pack levels', async () => {
    const row = createInboundPage.addItemsStep.table.row(0);
    await row.productSelect.findAndSelectOption(ROW.productCode);
    await row.quantityField.numberbox.fill(ROW.quantity);
  });

  await createInboundPage.nextButton.click();

  await test.step('Assert that pack level columns are not visible ons end page', async () => {
    const row = createInboundPage.sendStep.table.row(0);
    await expect(row.productCode.field).toContainText(ROW.productCode);
    await expect(row.quantityPicked.field).toContainText(ROW.quantity);
    await expect(row.packLevel1.field).toBeHidden();
    await expect(row.packLevel2.field).toBeHidden();
  });

  await test.step('Go back to add items step', async () => {
    await createInboundPage.previousButton.click();
    await createInboundPage.sendStep.validationPopup.assertPopupVisible();
    await createInboundPage.sendStep.validationPopup.confirmButton.click();
  });

  await test.step('Fill in Pack Level 1 on first row', async () => {
    await createInboundPage.addItemsStep.table
      .row(0)
      .packLevel1Field.textbox.fill(PACK_LEVEL_1);
  });

  await createInboundPage.nextButton.click();

  await test.step('Assert that pack level 1 columns is visible on send page after update', async () => {
    const row = createInboundPage.sendStep.table.row(0);
    await expect(row.productCode.field).toContainText(ROW.productCode);
    await expect(row.quantityPicked.field).toContainText(ROW.quantity);
    await expect(row.packLevel1.field).toContainText(PACK_LEVEL_1);
    await expect(row.packLevel2.field).toBeHidden();
  });

  await test.step('Go back to add items step', async () => {
    await createInboundPage.previousButton.click();
    await createInboundPage.sendStep.validationPopup.assertPopupVisible();
    await createInboundPage.sendStep.validationPopup.confirmButton.click();
  });

  await test.step('Fill in Pack Level 2 on first row', async () => {
    await createInboundPage.addItemsStep.table
      .row(0)
      .packLevel2Field.textbox.fill(PACK_LEVEL_2);
  });

  await createInboundPage.nextButton.click();

  await test.step('Assert that both pack level columns are visible on send page after update', async () => {
    const row = createInboundPage.sendStep.table.row(0);
    await expect(row.productCode.field).toContainText(ROW.productCode);
    await expect(row.quantityPicked.field).toContainText(ROW.quantity);
    await expect(row.packLevel1.field).toContainText(PACK_LEVEL_1);
    await expect(row.packLevel2.field).toContainText(PACK_LEVEL_2);
  });
});

// TODO add test for step 12
// TODO add test for step 13

test('Use Control+ArrowDown copy cell shortcut', async ({
  page,
  createInboundPage,
}) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();
  const ROW = {
    packLevel1: 'pallet_test',
    packLevel2: 'box_test',
    lot: 'lot_test',
    quantity: '12',
  };

  await test.step('Create Stock Movement', async () => {
    await createInboundPage.goToPage();

    await createInboundPage.createStep.descriptionField.textbox.fill(
      DESCRIPTION
    );
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);

    await createInboundPage.nextButton.click();
  });

  await test.step('Add additional rows', async () => {
    await createInboundPage.addItemsStep.addLineButton.click({ delay: 300 });
    await createInboundPage.addItemsStep.addLineButton.click({ delay: 300 });
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
      .lotField.textbox.fill(ROW.lot);
    await page.keyboard.press('Control+ArrowDown');
    await page.keyboard.press('Control+ArrowDown');

    await expect(
      createInboundPage.addItemsStep.table.row(0).lotField.textbox
    ).toHaveValue(ROW.lot);
    await expect(
      createInboundPage.addItemsStep.table.row(1).lotField.textbox
    ).toHaveValue(ROW.lot);
    await expect(
      createInboundPage.addItemsStep.table.row(2).lotField.textbox
    ).toHaveValue(ROW.lot);
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

test('Save and exit stock movement on add items step', async ({
  stockMovementShowPage,
  createInboundPage,
  mainLocation,
}) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();
  const currentLocation = await mainLocation.getLocation();
  const ROW = {
    productCode: '10001',
    quantity: '12',
    lotNumber: 'test123',
    recipient: 'dare',
  };
  const UPDATED_QUANTITY = '7';

  await createInboundPage.goToPage();

  await test.step('Create Stock Movement step', async () => {
    await createInboundPage.createStep.isLoaded();

    await expect(
      createInboundPage.createStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);

    await createInboundPage.createStep.descriptionField.textbox.fill(
      DESCRIPTION
    );
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
  });

  await test.step('Go to next page', async () => {
    await createInboundPage.nextButton.click();
  });

  await test.step('Add items step', async () => {
    const row = createInboundPage.addItemsStep.table.row(0);
    await row.productSelect.findAndSelectOption(ROW.productCode);
    await row.quantityField.numberbox.fill(ROW.quantity);
    await row.lotField.textbox.fill(ROW.lotNumber);
    await row.recipientSelect.findAndSelectOption(ROW.recipient);
  });

  await test.step('Save and exit', async () => {
    await createInboundPage.addItemsStep.saveAndExitButton.click();
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
    await expect(row.productSelect.selectField).toContainText(ROW.productCode);
    await expect(row.lotField.textbox).toHaveValue(ROW.lotNumber);
    await expect(row.quantityField.numberbox).toHaveValue(ROW.quantity);
    await expect(row.recipientSelect.selectField).toContainText(ROW.recipient);
  });

  await test.step('Update row with different quantity', async () => {
    const row = createInboundPage.addItemsStep.table.row(0);
    await row.quantityField.numberbox.fill(UPDATED_QUANTITY);
  });

  await test.step('save and exit', async () => {
    await createInboundPage.addItemsStep.saveAndExitButton.click();
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
  mainLocation,
  supplierLocation,
  locationChooser,
  navbar,
  createLocationPage,
}) => {
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();
  const ORIGIN = await supplierLocation.getLocation();
  const currentLocation = await mainLocation.getLocation();
  const ROW = {
    productCode: '10001',
    quantity: '12',
    lotNumber: 'test123',
    recipient: 'dare',
  };
  const uniqueIdentifier = new UniqueIdentifier();

  const OTHER_LOCATION_NAME = uniqueIdentifier.generateUniqueString('Other depot location');;
  const OTHER_LOCATION_ORGANIZATION = currentLocation.organization?.name as string;


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
    await createLocationPage.locationDetailsTabSection.getOrganization(OTHER_LOCATION_ORGANIZATION).click();

    await createLocationPage.locationDetailsTabSection.saveButton.click();
  });

  await test.step('Go to create inbound page', async () => {
    await createInboundPage.goToPage();
  })

  await test.step('Create Stock Movement step', async () => {
    await createInboundPage.createStep.isLoaded();

    await expect(
      createInboundPage.createStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);

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
    const row = createInboundPage.addItemsStep.table.row(0);
    await row.productSelect.findAndSelectOption(ROW.productCode);
    await row.quantityField.numberbox.fill(ROW.quantity);
    await row.lotField.textbox.fill(ROW.lotNumber);
    await row.recipientSelect.findAndSelectOption(ROW.recipient);
  });

  await test.step('Save and exit', async () => {
    await createInboundPage.addItemsStep.saveAndExitButton.click();
    await stockMovementShowPage.isLoaded();
  });

  await test.step('switch locations', async () => {
    await expect(navbar.locationChooserButton).toContainText(currentLocation.name);

    await navbar.locationChooserButton.click();
    await locationChooser.getOrganization(OTHER_LOCATION_ORGANIZATION).click();
    await locationChooser.getLocation(OTHER_LOCATION_NAME).click();
  });

  await test.step('Assert user should stay on same page without being redirected', async () => {
    await expect(navbar.locationChooserButton).toContainText(OTHER_LOCATION_NAME);
    await stockMovementShowPage.isLoaded();
  })
  
});
