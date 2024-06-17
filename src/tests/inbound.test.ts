import { expect,test } from '@/fixtures/fixtures';

test('create step', async ({ createInboundPage }) => {
  const ORIGIN = 'Imres (OG)';
  const REQUESTOR = 'dare';
  const DESCRIPTION = 'some description';

  await createInboundPage.goToPage();

  await test.step('Create step', async () => {
    await createInboundPage.createStep.isLoaded();
    await createInboundPage.wizzardSteps.assertStepStatus('Create', true);

    await createInboundPage.createStep.descriptionField.fill(DESCRIPTION);
    await createInboundPage.createStep.originSelect.findAndSelectOption(ORIGIN);
    await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
      REQUESTOR
    );
    await createInboundPage.createStep.dateRequestedDatePicker.fill(new Date());

    await createInboundPage.nextButton.click();
  });

  await test.step('Add items step', async () => {
    await createInboundPage.wizzardSteps.assertStepStatus('Add items', true);

    await createInboundPage.addItemsStep.waitForData();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);

    const row = createInboundPage.addItemsStep.table.row(0);
    await row.productSelect.findAndSelectOption('10001');
    await row.lotField.fill('test123');
    await row.quantityField.fill('12');
    await row.recipientSelect.findAndSelectOption('dare');

    await createInboundPage.addItemsStep.addLineButton.click();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(2);
    
    await createInboundPage.addItemsStep.table.row(1).deleteButton.click();
    expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);

    await createInboundPage.nextButton.click();
  });
});
