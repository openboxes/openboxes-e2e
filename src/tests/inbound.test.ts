import { test } from '@/fixtures/fixtures';

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
});
