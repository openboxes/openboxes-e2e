import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';

test.describe('Switching location on inbound stock movement', () => {
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

  test.afterEach(async ({ stockMovementService, authService }) => {
    await authService.changeLocation(AppConfig.instance.locations.main.id);
    await stockMovementService.deleteStockMovement(INBOUND_ID);
  });

  test('Switch location on stock movement show page', async ({
    stockMovementShowPage,
    createInboundPage,
    locationChooser,
    navbar,
    depotLocationService,
    mainLocationService,
  }) => {
    const OTHER_LOCATION = await depotLocationService.getLocation();

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

    await test.step('switch locations', async () => {
      const CURRENT_LOCATION = await mainLocationService.getLocation();

      await expect(navbar.locationChooserButton).toContainText(
        CURRENT_LOCATION.name
      );

      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(OTHER_LOCATION.organization?.name as string)
        .click();
      await locationChooser.getLocation(OTHER_LOCATION.name).click();
    });

    await test.step('Assert user should stay on same page without being redirected', async () => {
      await expect(navbar.locationChooserButton).toContainText(
        OTHER_LOCATION.name
      );
      await stockMovementShowPage.isLoaded();
    });
  });
});
