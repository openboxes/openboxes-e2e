import { expect, test } from '@/fixtures/fixtures';

test('create step', async ({ createInboundPage }) => {
  const description = 'some description';
  await createInboundPage.goToPage();
  // input descripton
  await createInboundPage.createStep.descriptionField.fill(description);
  // input origin
  await createInboundPage.createStep.originSelect.click();
  await createInboundPage.createStep.originSelect
    .getByRole('textbox')
    .fill('imres');
  await createInboundPage.createStep.originSelect
    .getByText('Imres (OG) [Supplier]', { exact: true })
    .click({ timeout: 3000 });

    // input requested by

  await createInboundPage.createStep.requestedBySelect.click();
  await createInboundPage.createStep.requestedBySelect
    .getByRole('textbox')
    .fill('dare');
  await createInboundPage.createStep.requestedBySelect
    .getByRole('list')
    .getByText('dare')
    .click();
  // date requested
  // click next
  expect(true).toBeTruthy();
});
