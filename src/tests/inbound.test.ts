import { expect, test } from '@/fixtures/fixtures';

test('create step', async ({ createInboundPage, mainLocation }) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';
  const TODAY = new Date();
  const currentLocation = await mainLocation.getLocation();

  await createInboundPage.goToPage();

  await test.step('Create step', async () => {
    await createInboundPage.createStep.isLoaded();
    await createInboundPage.wizzardSteps.assertStepStatus('Create', true);

    await expect(
      createInboundPage.createStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);

    await createInboundPage.createStep.descriptionField.field.fill(DESCRIPTION);
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);

    await createInboundPage.nextButton.click();
  });

  await test.step('Add items step', async () => {
    await createInboundPage.wizzardSteps.assertStepStatus('Add items', true);
    // assert header Stock Movement | 736KDG - Donation Imres to Lisungwi Warehouse, 06/18/2024, fef
    await createInboundPage.addItemsStep.waitForData();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);

    // table with empty values shuld have disabled next button
    await expect(createInboundPage.previousButton).toBeEnabled();
    await expect(createInboundPage.nextButton).toBeDisabled();

    const row = createInboundPage.addItemsStep.table.row(0);

    await row.productSelect.findAndSelectOption('10001');
    await row.quantityField.fill('12');
    // next button should be enabled after filling all required fields
    await expect(createInboundPage.previousButton).toBeEnabled();
    await expect(createInboundPage.nextButton).toBeEnabled();
    await expect(createInboundPage.addItemsStep.saveButton).toBeEnabled();
    await expect(
      createInboundPage.addItemsStep.saveAndExitButton
    ).toBeEnabled();
    await expect(createInboundPage.addItemsStep.deleteAllButton).toBeEnabled();

    await row.lotField.fill('test123');
    await row.recipientSelect.findAndSelectOption('dare');

    await createInboundPage.addItemsStep.addLineButton.click();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(2);

    await createInboundPage.addItemsStep.table.row(1).deleteButton.click();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
  });

  // save and exit
  // confirmation modal
  // redirected to view page
  // status Pending should be visible
  // Date shipped in auditing should be empty

  // click edit on show page
  // check items in the table should not change

  // on send page check origin, destination, description field are same as on create step
  // Once shipment is send, Date Shipped in auditing should be filled with user who shipped it and the date
});

test('go back', async ({ createInboundPage, mainLocation }) => {
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

  await test.step('Go to create step', async () => {
    await createInboundPage.goToPage();

    await createInboundPage.wizzardSteps.assertStepStatus('Create', true);
    await createInboundPage.wizzardSteps.assertStepStatus('Add items', false);
    await createInboundPage.wizzardSteps.assertStepStatus('Send', false);
  });

  await test.step('Fill in create step fields', async () => {
    await createInboundPage.createStep.descriptionField.field.fill(DESCRIPTION);
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
  });

  await test.step('Go to add items step', async () => {
    await createInboundPage.nextButton.click();
    await createInboundPage.addItemsStep.isLoaded();

    await createInboundPage.wizzardSteps.assertStepStatus('Create', false);
    await createInboundPage.wizzardSteps.assertStepStatus('Add items', true);
    await createInboundPage.wizzardSteps.assertStepStatus('Send', false);
  });

  await test.step('Fill in add items fields', async () => {
    for (let i = 0; i < ROWS.length; i++) {
      const data = ROWS[i];
      const row = createInboundPage.addItemsStep.table.row(i);
      await row.productSelect.findAndSelectOption(data.productCode);
      await row.quantityField.fill(data.quantity);
      await row.lotField.fill(data.lotNumber);
      await row.recipientSelect.findAndSelectOption(data.recipient);

      await createInboundPage.addItemsStep.addLineButton.click();
    }
  });

  await test.step('Go to send step', async () => {
    await createInboundPage.nextButton.click();

    await createInboundPage.wizzardSteps.assertStepStatus('Create', false);
    await createInboundPage.wizzardSteps.assertStepStatus('Add items', false);
    await createInboundPage.wizzardSteps.assertStepStatus('Send', true);

    await createInboundPage.sendStep.isLoaded();
  });

  await test.step('assert data on send step', async () => {
    await expect(createInboundPage.sendStep.originField).toHaveValue(ORIGIN);
    await expect(
      createInboundPage.sendStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);
    // await expect(createInboundPage.sendStep.shipDateDatePicker.dateInputField).toHaveValue(TODAY);

    for (let i = 0; i < ROWS.length; i++) {
      const data = ROWS[i];
      const row = createInboundPage.sendStep.table.row(i);
      await expect(row.productCode).toContainText(data.productCode);
      await expect(row.lotNumber).toContainText(data.lotNumber);
      await expect(row.quantityPicked).toContainText(data.quantity);
      await expect(row.recipient).toContainText(data.recipient);
    }
  });

  await test.step('Go back to add items step', async () => {
    await createInboundPage.previousButton.click();
    await createInboundPage.sendStep.validationPopup.assertPopupVisible();
    await createInboundPage.sendStep.validationPopup.confirmButton.click();

    await createInboundPage.addItemsStep.isLoaded();

    await createInboundPage.wizzardSteps.assertStepStatus('Create', false);
    await createInboundPage.wizzardSteps.assertStepStatus('Add items', true);
    await createInboundPage.wizzardSteps.assertStepStatus('Send', false);
  });

  await test.step('assert data on add items step when going back', async () => {
    for (let i = 0; i < ROWS.length; i++) {
      const data = ROWS[i];
      const row = createInboundPage.addItemsStep.table.row(i);
      await expect(row.productSelect.selectField).toContainText(
        data.productCode
      );
      await expect(row.lotField).toHaveValue(data.lotNumber);
      await expect(row.quantityField).toHaveValue(data.quantity);
      await expect(row.recipientSelect.selectField).toContainText(
        data.recipient
      );
    }
  });

  await test.step('go back to create step', async () => {
    await createInboundPage.previousButton.click();

    await expect(createInboundPage.createStep.descriptionField.field).toHaveValue(
      DESCRIPTION
    );
    await expect(
      createInboundPage.createStep.originSelect.selectField
    ).toContainText(ORIGIN);
    await expect(
      createInboundPage.createStep.destinationSelect.selectField
    ).toContainText(currentLocation.name);
    await expect(
      createInboundPage.createStep.requestedBySelect.selectField
    ).toContainText(REQUESTOR);
    // await expect(createInboundPage.createStep.dateRequestedDatePicker.dateInputField).toHaveValue(new Intl.DateTimeFormat('en-029').format(TODAY));
  });
});

test('pack levels visiblity', async ({ createInboundPage }) => {
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

  await test.step('create stock movement', async () => {
    await createInboundPage.goToPage();

    await test.step('Fill in create step fields', async () => {
      await createInboundPage.createStep.descriptionField.field.fill(DESCRIPTION);
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        REQUESTOR
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
    });

    await createInboundPage.nextButton.click();

    await test.step('Fill in add items fields', async () => {
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(ROW.productCode);
      await row.quantityField.fill(ROW.quantity);
    });
  });

  await test.step('pack levels none', async () => {
    await createInboundPage.nextButton.click();

    await test.step('Assert data on send step', async () => {
      const row = createInboundPage.sendStep.table.row(0);
      await expect(row.productCode).toContainText(ROW.productCode);
      await expect(row.quantityPicked).toContainText(ROW.quantity);
      await expect(row.packLevel1).toBeHidden();
      await expect(row.packLevel2).toBeHidden();
    });

    await test.step('Go back to add items step', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.confirmButton.click();
    });
  });

  await test.step('pack levels level 1', async () => {
    await test.step('Fill in pack level 1', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel1Field.fill(PACK_LEVEL_1);
    });

    await createInboundPage.nextButton.click();

    await test.step('Assert data on send step', async () => {
      const row = createInboundPage.sendStep.table.row(0);
      await expect(row.productCode).toContainText(ROW.productCode);
      await expect(row.quantityPicked).toContainText(ROW.quantity);
      await expect(row.packLevel1).toContainText(PACK_LEVEL_1);
      await expect(row.packLevel2).toBeHidden();
    });

    await test.step('Go back to add items step', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.confirmButton.click();
    });
  });

  await test.step('pack levels level 2', async () => {
    await test.step('Fill in pack level 2', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel2Field.fill(PACK_LEVEL_2);
    });

    await createInboundPage.nextButton.click();

    await test.step('Assert data on send step', async () => {
      const row = createInboundPage.sendStep.table.row(0);
      await expect(row.productCode).toContainText(ROW.productCode);
      await expect(row.quantityPicked).toContainText(ROW.quantity);
      await expect(row.packLevel1).toContainText(PACK_LEVEL_1);
      await expect(row.packLevel2).toContainText(PACK_LEVEL_2);
    });
  });
});

test('arrows', async ({ page, createInboundPage }) => {
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

  await test.step('create stock movement', async () => {
    await createInboundPage.goToPage();

    await test.step('Fill in create step fields', async () => {
      await createInboundPage.createStep.descriptionField.field.fill(DESCRIPTION);
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        REQUESTOR
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
    });

    await createInboundPage.nextButton.click();

    await test.step('Add additional rows', async () => {
      await createInboundPage.addItemsStep.addLineButton.click({ delay: 300 });
      await createInboundPage.addItemsStep.addLineButton.click({ delay: 300 });
    });

    await test.step('assert pack level 1 copy cells ctrl+down', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel1Field.fill(ROW.packLevel1);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).packLevel1Field
      ).toHaveValue(ROW.packLevel1);
      await expect(
        createInboundPage.addItemsStep.table.row(1).packLevel1Field
      ).toHaveValue(ROW.packLevel1);
      await expect(
        createInboundPage.addItemsStep.table.row(2).packLevel1Field
      ).toHaveValue(ROW.packLevel1);
    });

    await test.step('assert pack level 2 copy cells ctrl+down', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .packLevel2Field.fill(ROW.packLevel2);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).packLevel2Field
      ).toHaveValue(ROW.packLevel2);
      await expect(
        createInboundPage.addItemsStep.table.row(1).packLevel2Field
      ).toHaveValue(ROW.packLevel2);
      await expect(
        createInboundPage.addItemsStep.table.row(2).packLevel2Field
      ).toHaveValue(ROW.packLevel2);
    });

    await test.step('assert lot copy cells ctrl+down', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .lotField.fill(ROW.lot);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).lotField
      ).toHaveValue(ROW.lot);
      await expect(
        createInboundPage.addItemsStep.table.row(1).lotField
      ).toHaveValue(ROW.lot);
      await expect(
        createInboundPage.addItemsStep.table.row(2).lotField
      ).toHaveValue(ROW.lot);
    });

    await test.step('assert quantity copy cells ctrl+down', async () => {
      await createInboundPage.addItemsStep.table
        .row(0)
        .quantityField.fill(ROW.quantity);
      await page.keyboard.press('Control+ArrowDown');
      await page.keyboard.press('Control+ArrowDown');

      await expect(
        createInboundPage.addItemsStep.table.row(0).quantityField
      ).toHaveValue(ROW.quantity);
      await expect(
        createInboundPage.addItemsStep.table.row(1).quantityField
      ).toHaveValue(ROW.quantity);
      await expect(
        createInboundPage.addItemsStep.table.row(2).quantityField
      ).toHaveValue(ROW.quantity);
    });
  });
});