import LocationChooser from '@/components/LocationChooser';
import Navbar from '@/components/Navbar';
import AppConfig, { LOCATION_KEY } from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import CreateLocationPage from '@/pages/location/createLocation/CreateLocationPage';
import LocationListPage from '@/pages/location/LocationListPage';
import CreateLocationGroupPage from '@/pages/locationGroup/CreateLocationGroupPage';
import EditLocationGroupPage from '@/pages/locationGroup/EditLocationGroupPage';
import LocationGroupsListPage from '@/pages/locationGroup/LocationGroupsListPage';
import LoginPage from '@/pages/LoginPage';
import CreateOrganizationPage from '@/pages/oranization/CreateOrganizationPage';
import EditOrganizationPage from '@/pages/oranization/EditOrganizationPage';
import OrganizationListPage from '@/pages/oranization/OrganizationListPage';
import { LocationResponse } from '@/types';
import LocationData from '@/utils/LocationData';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Check if depot location is present in location chooser', () => {
  const uniqueIdentifier = new UniqueIdentifier();
  const ORGANIZATION_NAME =
    uniqueIdentifier.generateUniqueString('test-Organization');
  const GROUP_NAME = uniqueIdentifier.generateUniqueString('test-Group');
  const LOCATION_NAME = uniqueIdentifier.generateUniqueString('test-Depot');
  const LOCATION_COLOR = '#009DD1';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    const createOrganizationPage = new CreateOrganizationPage(page);
    const editOrganizationPage = new EditOrganizationPage(page);
    const navbar = new Navbar(page);
    const locationGroupsListPage = new LocationGroupsListPage(page);
    const createLocationGroupPage = new CreateLocationGroupPage(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);

    await test.step('Go to create organization page', async () => {
      await createOrganizationPage.goToPage();
    });

    await test.step('Create organization', async () => {
      await createOrganizationPage.organizationNameField.fill(
        ORGANIZATION_NAME
      );
      await createOrganizationPage.createButton.click();
      await expect(
        editOrganizationPage.createOrganizationSuccessMessage
      ).toBeVisible();
    });

    await test.step('Go to create location group page', async () => {
      await navbar.configurationButton.click();
      await navbar.locationGroup.click();
      await locationGroupsListPage.createLocationButton.click();
      await createLocationGroupPage.locationGroupNameField.fill(GROUP_NAME);
      await createLocationGroupPage.createButton.click();
    });

    await test.step('Go to create location page', async () => {
      await navbar.configurationButton.click();
      await navbar.locations.click();
      await locationListPage.createLocationButton.click();
    });

    await test.step('Create location, Depot with background color', async () => {
      await createLocationPage.locationDetailsTabSection.locationNameField.fill(
        LOCATION_NAME
      );
      await createLocationPage.locationDetailsTabSection.organizationSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getOrganization(ORGANIZATION_NAME)
        .click();
      await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getlocationTypeOption('Depot')
        .click();
      await createLocationPage.locationDetailsTabSection.locationGroupSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getLocationGroupOption(GROUP_NAME)
        .click();
      await createLocationPage.locationDetailsTabSection.saveButton.click();
      await createLocationPage.locationConfigurationTab.click();
      await createLocationPage.locationConfigurationTabSection.backgroundColorField.click();
      await createLocationPage.locationConfigurationTabSection.backgroundColorField.clear();
      await createLocationPage.locationConfigurationTabSection.backgroundColorField.fill(
        LOCATION_COLOR
      );
      await createLocationPage.locationConfigurationTabSection.saveButton.click();
    });
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();

    const editOrganizationPage = new EditOrganizationPage(page);
    const navbar = new Navbar(page);
    const locationGroupsListPage = new LocationGroupsListPage(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);
    const organizationListPage = new OrganizationListPage(page);
    const editLocationGroupPage = new EditLocationGroupPage(page);

    await test.step('Delete created location', async () => {
      await page.goto('./dashboard');
      await navbar.configurationButton.click();
      await navbar.locations.click();
      await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
      await locationListPage.findButton.click();
      await locationListPage.getLocationEditButton(LOCATION_NAME).click();
      await createLocationPage.actionButton.click();
      await createLocationPage.clickDeleteLocation();
    });

    await test.step('Assert that location does not exists in the list', async () => {
      await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
      await locationListPage.findButton.click();
      await expect(
        locationListPage.getLocationEditButton(LOCATION_NAME)
      ).toBeHidden();
    });

    await test.step('Delete created organization', async () => {
      await navbar.configurationButton.click();
      await navbar.organizations.click();
      await organizationListPage.searchByOrganizationNameField.fill(
        ORGANIZATION_NAME
      );
      await organizationListPage.searchButton.click();
      await organizationListPage
        .getOrganizationToEdit(ORGANIZATION_NAME)
        .click();
      await editOrganizationPage.clickDeleteOrganization();
    });

    await test.step('Assert that organization does not exists in the list', async () => {
      await organizationListPage.searchByOrganizationNameField.fill(
        ORGANIZATION_NAME
      );
      await organizationListPage.searchButton.click();
      await expect(
        organizationListPage.getOrganizationToEdit(ORGANIZATION_NAME)
      ).toBeHidden();
    });

    await test.step('Delete created location group', async () => {
      await navbar.configurationButton.click();
      await navbar.locationGroup.click();
      await locationGroupsListPage.getPaginationItem('3').click();
      await locationGroupsListPage.getLocationGroupnToEdit(GROUP_NAME).click();
      await editLocationGroupPage.clickDeleteLocationGroup();
    });

    await page.close();
  });

  test('Assert created location on location chooser, gsp page', async ({
    page,
    navbar,
    locationChooser,
  }) => {
    await page.goto('./dashboard');
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization(ORGANIZATION_NAME)
    ).toBeVisible();
    await locationChooser.getOrganization(ORGANIZATION_NAME).click();
    await expect(locationChooser.getLocationGroup(GROUP_NAME)).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await locationChooser.assertLocationColor(LOCATION_NAME, LOCATION_COLOR);
    await locationChooser.closeLocationChooserButton.click();
  });

  test('Assert created location on location chooser, react page', async ({
    page,
    navbar,
    locationChooser,
  }) => {
    await page.goto('./dashboard');
    await navbar.dashboard.click();
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization(ORGANIZATION_NAME)
    ).toBeVisible();
    await locationChooser.getOrganization(ORGANIZATION_NAME).click();
    await expect(locationChooser.getLocationGroup(GROUP_NAME)).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await locationChooser.assertLocationColor(LOCATION_NAME, LOCATION_COLOR);
    await locationChooser.closeLocationChooserButton.click();
  });

  test('Assert created location on location chooser, log in', async ({
    emptyUserContext,
  }) => {
    const newPage = await emptyUserContext.newPage();
    const loginPage = new LoginPage(newPage);
    const locationChooser = new LocationChooser(newPage);
    const navbar = new Navbar(newPage);

    await test.step('Login as new created user', async () => {
      await loginPage.goToPage();
      await loginPage.fillLoginForm(
        AppConfig.instance.users.main.username,
        AppConfig.instance.users.main.password
      );
      await loginPage.loginButton.click();
    });

    await expect(
      locationChooser.getOrganization(ORGANIZATION_NAME)
    ).toBeVisible();
    await locationChooser.getOrganization(ORGANIZATION_NAME).click();
    await expect(locationChooser.getLocationGroup(GROUP_NAME)).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await expect(locationChooser.yourLastSingInInfo).toBeVisible();
    await locationChooser.assertLocationColor(LOCATION_NAME, LOCATION_COLOR);
    await locationChooser.getLocation(LOCATION_NAME).click();
    await expect(navbar.locationChooserButton).toContainText(LOCATION_NAME);
  });
});

test.describe('Check if location is present in location chooser after editing', () => {
  const uniqueIdentifier = new UniqueIdentifier();
  const ORGANIZATION_NAME =
    uniqueIdentifier.generateUniqueString('Test-Organization');
  const ORGANIZATION_NAME_SECOND = uniqueIdentifier.generateUniqueString(
    'Test-Other-Organization'
  );
  const LOCATION_NAME = uniqueIdentifier.generateUniqueString('Test-Depot');

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    const createOrganizationPage = new CreateOrganizationPage(page);
    const navbar = new Navbar(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);
    const editOrganizationPage = new EditOrganizationPage(page);

    await test.step('Go to create organization page', async () => {
      await createOrganizationPage.goToPage();
    });

    await test.step('Create organization', async () => {
      await createOrganizationPage.organizationNameField.fill(
        ORGANIZATION_NAME
      );
      await createOrganizationPage.createButton.click();
      await expect(
        editOrganizationPage.createOrganizationSuccessMessage
      ).toBeVisible();
    });

    await test.step('Create second organization', async () => {
      await editOrganizationPage.createOrganizationButton.click();
      await createOrganizationPage.organizationNameField.fill(
        ORGANIZATION_NAME_SECOND
      );
      await createOrganizationPage.createButton.click();
      await expect(
        editOrganizationPage.createOrganizationSuccessMessage
      ).toBeVisible();
    });

    await test.step('Go to create location page', async () => {
      await navbar.configurationButton.click();
      await navbar.locations.click();
      await locationListPage.createLocationButton.click();
    });

    await test.step('Create location, Depot', async () => {
      await createLocationPage.locationDetailsTabSection.locationNameField.fill(
        LOCATION_NAME
      );
      await createLocationPage.locationDetailsTabSection.organizationSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getOrganization(ORGANIZATION_NAME)
        .click();
      await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getlocationTypeOption('Depot')
        .click();
      await createLocationPage.locationDetailsTabSection.saveButton.click();
    });
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();

    const organizationListPage = new OrganizationListPage(page);
    const navbar = new Navbar(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);
    const editOrganizationPage = new EditOrganizationPage(page);

    await page.goto('./dashboard');

    await test.step('Delete created location', async () => {
      await navbar.configurationButton.click();
      await navbar.locations.click();
      await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
      await locationListPage.findButton.click();
      await locationListPage.getLocationEditButton(LOCATION_NAME).click();
      await createLocationPage.actionButton.click();
      await createLocationPage.clickDeleteLocation();
    });

    await test.step('Assert that location does not exists in the list', async () => {
      await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
      await locationListPage.findButton.click();
      await expect(
        locationListPage.getLocationEditButton(LOCATION_NAME)
      ).toBeHidden();
    });

    await test.step('Delete created organizations', async () => {
      await navbar.configurationButton.click();
      await navbar.organizations.click();
      await organizationListPage.searchByOrganizationNameField.fill(
        ORGANIZATION_NAME
      );
      await organizationListPage.searchButton.click();
      await organizationListPage
        .getOrganizationToEdit(ORGANIZATION_NAME)
        .click();
      await editOrganizationPage.clickDeleteOrganization();
      await organizationListPage.searchByOrganizationNameField.fill(
        ORGANIZATION_NAME_SECOND
      );
      await organizationListPage.searchButton.click();
      await organizationListPage
        .getOrganizationToEdit(ORGANIZATION_NAME_SECOND)
        .click();
      await editOrganizationPage.clickDeleteOrganization();
    });

    await test.step('Assert that organizations do not exists in the list', async () => {
      await organizationListPage.searchByOrganizationNameField.fill(
        ORGANIZATION_NAME
      );
      await organizationListPage.searchButton.click();
      await expect(
        organizationListPage.getOrganizationToEdit(ORGANIZATION_NAME)
      ).toBeHidden();
      await organizationListPage.searchByOrganizationNameField.clear();
      await organizationListPage.searchByOrganizationNameField.fill(
        ORGANIZATION_NAME_SECOND
      );
      await organizationListPage.searchButton.click();
      await expect(
        organizationListPage.getOrganizationToEdit(ORGANIZATION_NAME_SECOND)
      ).toBeHidden();
    });
    await page.close();
  });

  test('Assert created location on location chooser', async ({
    page,
    navbar,
    locationChooser,
  }) => {
    await page.goto('./dashboard');

    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization(ORGANIZATION_NAME)
    ).toBeVisible();
    await locationChooser.getOrganization(ORGANIZATION_NAME).click();
    await expect(
      locationChooser.getLocationGroup('No Location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  test.describe('After updating location group', async () => {
    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();

      const navbar = new Navbar(page);
      const locationListPage = new LocationListPage(page);
      const createLocationPage = new CreateLocationPage(page);

      await page.goto('./dashboard');

      await navbar.configurationButton.click();
      await navbar.locations.click();
      await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
      await locationListPage.findButton.click();
      await locationListPage.getLocationEditButton(LOCATION_NAME).click();
      await createLocationPage.locationDetailsTabSection.organizationSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getOrganization(ORGANIZATION_NAME_SECOND)
        .click();
      await createLocationPage.locationDetailsTabSection.saveButton.click();
      await page.close();
    });

    test('Assert updated organization for location on location chooser, gsp page', async ({
      page,
      navbar,
      locationChooser,
    }) => {
      await page.goto('./dashboard');

      await navbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization(ORGANIZATION_NAME)
      ).toBeHidden();
      await expect(
        locationChooser.getOrganization(ORGANIZATION_NAME_SECOND)
      ).toBeVisible();
      await locationChooser.getOrganization(ORGANIZATION_NAME_SECOND).click();
      await expect(
        locationChooser.getLocationGroup('No Location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    test('Assert updated organization for location on location chooser, react page', async ({
      page,
      navbar,
      locationChooser,
    }) => {
      await page.goto('./dashboard');

      await navbar.dashboard.click();
      await navbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization(ORGANIZATION_NAME)
      ).toBeHidden();
      await expect(
        locationChooser.getOrganization(ORGANIZATION_NAME_SECOND)
      ).toBeVisible();
      await locationChooser.getOrganization(ORGANIZATION_NAME_SECOND).click();
      await expect(
        locationChooser.getLocationGroup('No Location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    test('Assert created Depot on location chooser, log in', async ({
      emptyUserContext,
    }) => {
      const newPage = await emptyUserContext.newPage();
      const loginPage = new LoginPage(newPage);
      const locationChooser = new LocationChooser(newPage);

      await test.step('Login as new created user', async () => {
        await loginPage.goToPage();
        await loginPage.fillLoginForm(
          AppConfig.instance.users.main.username,
          AppConfig.instance.users.main.password
        );
        await loginPage.loginButton.click();
      });
      await expect(
        locationChooser.getOrganization(ORGANIZATION_NAME)
      ).toBeHidden();
      await expect(
        locationChooser.getOrganization(ORGANIZATION_NAME_SECOND)
      ).toBeVisible();
      await locationChooser.getOrganization(ORGANIZATION_NAME_SECOND).click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await expect(locationChooser.yourLastSingInInfo).toBeVisible();
      await expect(locationChooser.locationChooserLogoutButton).toBeVisible();
    });
  });
});

test.describe('Check if non manage inventory location is present in location chooser', () => {
  const uniqueIdentifier = new UniqueIdentifier();
  const LOCATION_NAME = uniqueIdentifier.generateUniqueString('test-Depot');
  let location: LocationResponse;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    const mainLocation = new LocationData(LOCATION_KEY.MAIN, page.request);
    const navbar = new Navbar(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);

    location = await mainLocation.getLocation();
    await page.goto('./dashboard');

    await test.step('Go to create location page', async () => {
      await navbar.configurationButton.click();
      await navbar.locations.click();
      await locationListPage.createLocationButton.click();
    });

    await test.step('Create location, Depot without manage inventory', async () => {
      await createLocationPage.locationDetailsTabSection.locationNameField.fill(
        LOCATION_NAME
      );
      await createLocationPage.locationDetailsTabSection.organizationSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getOrganization(location.organization?.name ?? '')
        .click();
      await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
      await createLocationPage.locationDetailsTabSection
        .getlocationTypeOption('Depot')
        .click();
      await createLocationPage.locationDetailsTabSection.saveButton.click();
      await createLocationPage.locationConfigurationTab.click();
      await createLocationPage.locationConfigurationTabSection.useDefaultSettingsCheckbox.uncheck();
      await createLocationPage.locationConfigurationTabSection
        .removeSupportedActivitiesButton('Manage inventory')
        .click();
      await createLocationPage.locationConfigurationTabSection.saveButton.click();
    });
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();

    const navbar = new Navbar(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);

    await page.goto('./dashboard');

    await test.step('Delete created location', async () => {
      await navbar.configurationButton.click();
      await navbar.locations.click();
      await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
      await locationListPage.findButton.click();
      await locationListPage.getLocationEditButton(LOCATION_NAME).click();
      await createLocationPage.actionButton.click();
      await createLocationPage.clickDeleteLocation();
    });

    await test.step('Assert that location does not exists in the list', async () => {
      await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
      await locationListPage.findButton.click();
      await expect(
        locationListPage.getLocationEditButton(LOCATION_NAME)
      ).toBeHidden();
    });
    await page.close();
  });

  test('Assert created location on location chooser, gsp page', async ({
    page,
    navbar,
    locationChooser,
  }) => {
    await page.goto('./dashboard');

    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization(location.organization?.name ?? '')
    ).toBeVisible();
    await locationChooser
      .getOrganization(location.organization?.name ?? '')
      .click();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeHidden();
    await locationChooser.closeLocationChooserButton.click();
  });

  test('Assert created location on location chooser, react page', async ({
    page,
    navbar,
    locationChooser,
  }) => {
    await page.goto('./dashboard');

    await navbar.dashboard.click();
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization(location.organization?.name ?? '')
    ).toBeVisible();
    await locationChooser
      .getOrganization(location.organization?.name ?? '')
      .click();
    await expect(
      locationChooser.getLocation(location.organization?.name ?? '')
    ).toBeHidden();
    await locationChooser.closeLocationChooserButton.click();
  });

  test('Assert created location on location chooser, log in', async ({
    emptyUserContext,
  }) => {
    const newPage = await emptyUserContext.newPage();
    const loginPage = new LoginPage(newPage);
    const locationChooser = new LocationChooser(newPage);

    await test.step('Login as new created user', async () => {
      await loginPage.goToPage();
      await loginPage.fillLoginForm(
        AppConfig.instance.users.main.username,
        AppConfig.instance.users.main.password
      );
      await loginPage.loginButton.click();
    });

    await expect(
      locationChooser.getOrganization(location.organization?.name ?? '')
    ).toBeVisible();
    await locationChooser
      .getOrganization(location.organization?.name ?? '')
      .click();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeHidden();
  });
});
