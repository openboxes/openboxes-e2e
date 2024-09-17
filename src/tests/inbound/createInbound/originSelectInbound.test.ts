import { expect, test } from '@/fixtures/fixtures';
import CreateInboundPage from '@/pages/inbound/create/CreateInboundPage';
import { LocationResponse, User } from '@/types';

test.describe('Assert locations on origin select in inbound stock movement', () => {
  const DESCRIPTION = 'some description';
  let ORIGIN1: LocationResponse;
  let ORIGIN2: LocationResponse;
  let ORIGIN3: LocationResponse;
  let CURRENT_LOCATION: LocationResponse;
  let USER: User;
  let USER_MANAGER: User;

  test.beforeEach(
    async ({
      mainUserService,
      managerUserService,
      depotLocationService,
      noManageInventoryDepotService,
      mainLocationService,
      wardLocationService,
    }) => {
      USER = await mainUserService.getUser();
      USER_MANAGER = await managerUserService.getUser();
      ORIGIN1 = await depotLocationService.getLocation();
      ORIGIN2 = await noManageInventoryDepotService.getLocation();
      ORIGIN3 = await wardLocationService.getLocation();
      CURRENT_LOCATION = await mainLocationService.getLocation();
    }
  );

  test('Assert depots and wards for superusers', async ({
    createInboundPage,
  }) => {
    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });
    await test.step('Try to select depot with manage inventory permission as origin', async () => {
      await createInboundPage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
      await createInboundPage.createStep.originSelect.findOption(ORIGIN1.name);
      await expect(
        createInboundPage.createStep.originSelect.selectDropdown
      ).toHaveText('No results found');
    });

    await test.step('Try to select depot without manage inventory permission as origin', async () => {
      await createInboundPage.createStep.originSelect.findOption(ORIGIN2.name);
      await expect(
        createInboundPage.createStep.originSelect.selectDropdown
      ).toHaveText('No results found');
    });

    await test.step('Try to select ward as origin', async () => {
      await createInboundPage.createStep.originSelect.findOption(ORIGIN3.name);
      await expect(
        createInboundPage.createStep.originSelect.selectDropdown
      ).toHaveText('No results found');
    });
  });

  test('Assert depots and wards for maganers', async ({
    managerUserContext,
  }) => {
    const managerUserPage = await managerUserContext.newPage();
    const newManagerUsePage = new CreateInboundPage(managerUserPage);
    await test.step('Go to create inbound page', async () => {
      await newManagerUsePage.goToPage();
      await newManagerUsePage.createStep.isLoaded();
      await newManagerUsePage.wizzardSteps.assertActiveStep('Create');
    });
    await test.step('Try to select depot with manage inventory permission as origin', async () => {
      await newManagerUsePage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
      await newManagerUsePage.createStep.originSelect.findOption(ORIGIN1.name);
      await expect(
        newManagerUsePage.createStep.originSelect.selectDropdown
      ).toHaveText('No results found');
    });

    await test.step('Try to select depot without manage inventory permission as origin', async () => {
      await newManagerUsePage.createStep.originSelect.findOption(ORIGIN2.name);
      await expect(
        newManagerUsePage.createStep.originSelect.selectDropdown
      ).toHaveText('No results found');
    });

    await test.step('Try to select ward as origin', async () => {
      await newManagerUsePage.createStep.originSelect.findOption(ORIGIN3.name);
      await expect(
        newManagerUsePage.createStep.originSelect.selectDropdown
      ).toHaveText('No results found');
    });
  });
});
