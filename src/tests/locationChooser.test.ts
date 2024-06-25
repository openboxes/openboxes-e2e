import { expect, test } from '@/fixtures/fixtures';
import ImpersonateBanner from '@/pages/ImpersonateBanner';
import LocationChooser from '@/pages/LocationChooser';
import LoginPage from '@/pages/LoginPage';
import Navbar from '@/pages/Navbar';
import { LocationResponse, UserType } from '@/types';
import AppConfig from '@/utils/AppConfig';

const formData: UserType = {
  username: 'testUser_E2E',
  firstName: 'user_firstanme',
  lastName: 'user_lastname',
  password: 'testpassword123',
};

//tests are covering all steps from test case OBPIH-4644 Location Chooser
test.describe('Check if depot location is present in location chooser', () => {
  const ORGANIZATION_NAME = 'E2E-test-Organization';
  const GROUP_NAME = 'E2E-test-Group';
  const LOCATION_NAME = 'E2E-test-Depot';
  const LOCATION_COLOR = '#009DD1';

  test.beforeAll(
    async ({
      navbar,
      createOrganizationPage,
      editOrganizationPage,
      locationGroupsListPage,
      createLocationGroupPage,
      locationListPage,
      createLocationPage,
    }) => {
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
        await navbar.getNavItem('Location groups').click();
        await locationGroupsListPage.createLocationButton.click();
        await createLocationGroupPage.locationGroupNameField.fill(GROUP_NAME);
        await createLocationGroupPage.createButton.click();
      });

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create location, Depot with background color', async () => {
        await createLocationPage.locationDetailsTabSection.locationName.fill(
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
    }
  );

  test.afterAll(
    async ({
      page,
      navbar,
      locationListPage,
      organizationListPage,
      editOrganizationPage,
      locationGroupsListPage,
      createLocationPage,
      editLocationGroupPage,
    }) => {
      await test.step('Delete created location', async () => {
        await page.goto('./dashboard');
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationToEdit(LOCATION_NAME)
        ).toBeHidden();
      });

      await test.step('Delete created organization', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Organizations').click();
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
        await navbar.getNavItem('Location groups').click();
        await locationGroupsListPage.getPaginationItem('3').click();
        await locationGroupsListPage
          .getLocationGroupnToEdit(GROUP_NAME)
          .click();
        await editLocationGroupPage.clickDeleteLocationGroup();
      });
    }
  );

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
    await navbar.getNavItem('Dashboard').click();
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
    browser,
  }) => {
    const newCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newPage = await newCtx.newPage();
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
    await newCtx.close();
  });
});

test.describe('Check if ward location is present in location chooser', () => {
  const LOCATION_NAME = 'E2E-test-Ward';

  test.beforeAll(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      editUserPage,
    }) => {
      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create Ward location', async () => {
        await createLocationPage.locationDetailsTabSection.locationName.fill(
          LOCATION_NAME
        );
        await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
        await createLocationPage.locationDetailsTabSection
          .getlocationTypeOption('Ward')
          .click();
        await createLocationPage.locationDetailsTabSection.saveButton.click();
        await createLocationPage.locationConfigurationTab.click();
        await createLocationPage.locationConfigurationTabSection.useDefaultSettingsCheckbox.uncheck();
        await createLocationPage.locationConfigurationTabSection
          .removeSupportedActivities('None')
          .click();
        await createLocationPage.locationConfigurationTabSection.supportedActivities.click();
        await createLocationPage.locationConfigurationTabSection
          .getSupportedActivities('Submit request')
          .click();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });

      await test.step('Add user role for created Ward location', async () => {
        await navbar.profileButton.click();
        await navbar.editProfileButton.click();
        await editUserPage.authorizationTab.click();
        await editUserPage.authorizationTabSection.addLocationRolesButton.click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationSelectClearButton.click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationForLocationRoleSelect.click();
        await editUserPage.authorizationTabSection.locationRoleDialog
          .getLocationForLocationRole(LOCATION_NAME)
          .click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
        await editUserPage.authorizationTabSection.locationRoleDialog
          .getUserLocationRole('Requestor')
          .click();
        await editUserPage.authorizationTabSection.locationRoleDialog.saveButton.click();
      });
    }
  );

  test.afterAll(
    async ({
      page,
      navbar,
      editUserPage,
      locationListPage,
      createLocationPage,
    }) => {
      await page.goto('./dashboard');
      await test.step('Remove location role from user', async () => {
        await navbar.profileButton.click();
        await navbar.editProfileButton.click();
        await editUserPage.authorizationTab.click();
        await editUserPage.authorizationTabSection
          .deleteLocationRole(LOCATION_NAME)
          .click();
      });

      await test.step('Delete created ward location', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationToEdit(LOCATION_NAME)
        ).toBeHidden();
      });
    }
  );

  test('Assert created Ward on location chooser, gsp page', async ({
    page,
    navbar,
    locationChooser,
  }) => {
    await page.goto('./dashboard');
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('No organization')
    ).toBeVisible();
    await locationChooser.getOrganization('No organization').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  test('Assert created Ward on location chooser, react page', async ({
    page,
    navbar,
    locationChooser,
  }) => {
    await page.goto('./dashboard');
    await navbar.getNavItem('Dashboard').click();
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('No organization')
    ).toBeVisible();
    await locationChooser.getOrganization('No organization').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  test('Assert created Ward on location chooser, log in', async ({
    browser,
  }) => {
    const newCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newPage = await newCtx.newPage();
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
      locationChooser.getOrganization('No organization')
    ).toBeVisible();
    await locationChooser.getOrganization('No organization').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await expect(locationChooser.yourLastSingInInfo).toBeVisible();
    await expect(locationChooser.locationChooserLogoutButton).toBeVisible();
    await newCtx.close();
  });
});

test.describe('Check if location is present in location chooser after editing', () => {
  const ORGANIZATION_NAME = 'E2E-test-Organization';
  const ORGANIZATION_NAME_SECOND = 'E2E-test-Other-Organization';
  const LOCATION_NAME = 'E2E-test-Depot';

  test.beforeAll(
    async ({
      navbar,
      createOrganizationPage,
      editOrganizationPage,
      locationListPage,
      createLocationPage,
    }) => {
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
        await navbar.getNavItem('Locations').click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create location, Depot', async () => {
        await createLocationPage.locationDetailsTabSection.locationName.fill(
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
    }
  );

  test.afterAll(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      organizationListPage,
      editOrganizationPage,
    }) => {
      await page.goto('./dashboard');

      await test.step('Delete created location', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationToEdit(LOCATION_NAME)
        ).toBeHidden();
      });

      await test.step('Delete created organizations', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Organizations').click();
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
    }
  );

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
    test.beforeAll(
      async ({ page, navbar, locationListPage, createLocationPage }) => {
        await page.goto('./dashboard');

        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.locationDetailsTabSection.organizationSelect.click();
        await createLocationPage.locationDetailsTabSection
          .getOrganization(ORGANIZATION_NAME_SECOND)
          .click();
        await createLocationPage.locationDetailsTabSection.saveButton.click();
      }
    );

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

      await navbar.getNavItem('Dashboard').click();
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
      browser,
    }) => {
      const newCtx = await browser.newContext({
        storageState: { cookies: [], origins: [] },
      });
      const newPage = await newCtx.newPage();
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
      await newCtx.close();
    });
  });
});

test.describe('Check if non manage inventory location is present in location chooser', () => {
  const LOCATION_NAME = 'E2E-test-Depot';
  let location: LocationResponse;

  test.beforeAll(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      mainLocation,
    }) => {
      location = await mainLocation.getLocation();
      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create location, Depot without manage inventory', async () => {
        await createLocationPage.locationDetailsTabSection.locationName.fill(
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
          .removeSupportedActivities('Manage inventory')
          .click();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });
    }
  );
  test.afterAll(
    async ({ page, navbar, locationListPage, createLocationPage }) => {
      await page.goto('./dashboard');

      await test.step('Delete created location', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationToEdit(LOCATION_NAME)
        ).toBeHidden();
      });
    }
  );

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

    await navbar.getNavItem('Dashboard').click();
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
    browser,
  }) => {
    const newCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newPage = await newCtx.newPage();
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
    await newCtx.close();
  });
});

test.describe('Check if ward location is present in location chooser based on users permissions, location specific permission', () => {
  const LOCATION_NAME = 'E2E-test-Ward';

  test.beforeAll(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      editUserPage,
      userListPage,
      createUserPage,
    }) => {
      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create Ward location', async () => {
        await createLocationPage.locationDetailsTabSection.locationName.fill(
          LOCATION_NAME
        );
        await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
        await createLocationPage.locationDetailsTabSection
          .getlocationTypeOption('Ward')
          .click();
        await createLocationPage.locationDetailsTabSection.saveButton.click();
        await createLocationPage.locationConfigurationTab.click();
        await createLocationPage.locationConfigurationTabSection.useDefaultSettingsCheckbox.uncheck();
        await createLocationPage.locationConfigurationTabSection
          .removeSupportedActivities('None')
          .click();
        await createLocationPage.locationConfigurationTabSection.supportedActivities.click();
        await createLocationPage.locationConfigurationTabSection
          .getSupportedActivities('Submit request')
          .click();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });

      await test.step('Go to create user page', async () => {
        await page.goto('./dashboard');
        await navbar.configurationButton.click();
        await navbar.getNavItem('Users').click();
        await userListPage.createUserButton.click();
      });

      await test.step('Create new test user', async () => {
        await createUserPage.fillUserForm(formData);
        await createUserPage.saveButton.click();
        await expect(editUserPage.summary).toContainText(
          `${formData.firstName} ${formData.lastName}`
        );
        await editUserPage.userDetailsTabSection.activateUserCheckBox.click();
        await editUserPage.userDetailsTabSection.saveButton.click();
      });

      await test.step('Add user role for created Ward location', async () => {
        await editUserPage.authorizationTab.click();
        await editUserPage.authorizationTabSection.addLocationRolesButton.click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationSelectClearButton.click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationForLocationRoleSelect.click();
        await editUserPage.authorizationTabSection.locationRoleDialog
          .getLocationForLocationRole(LOCATION_NAME)
          .click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
        await editUserPage.authorizationTabSection.locationRoleDialog
          .getUserLocationRole('Requestor')
          .click();
        await editUserPage.authorizationTabSection.locationRoleDialog.saveButton.click();
      });
    }
  );

  test.afterAll(
    async ({
      page,
      navbar,
      editUserPage,
      locationListPage,
      createLocationPage,
      userListPage,
    }) => {
      await page.goto('./dashboard');
      await test.step('Go to edit user page', async () => {
        await userListPage.goToPage();
        await userListPage.searchByNameField.fill(formData.username);
        await userListPage.findButton.click();
        await userListPage.getUserToEdit(formData.username).click();
      });

      await test.step('Remove location role from user', async () => {
        await editUserPage.authorizationTab.click();
        await editUserPage.authorizationTabSection
          .deleteLocationRole(LOCATION_NAME)
          .click();
      });

      await test.step('Delete user', async () => {
        await editUserPage.actionButton.click();
        await editUserPage.clickDeleteUser();
      });

      await test.step('Assert that user does not exists in the list', async () => {
        await userListPage.searchByNameField.fill(formData.username);
        await userListPage.findButton.click();
        await expect(
          userListPage.getUserToEdit(formData.username)
        ).toBeHidden();
      });

      await test.step('Delete created ward location', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationToEdit(LOCATION_NAME)
        ).toBeHidden();
      });
    }
  );

  test('Assert created Ward on location chooser, admin role', async ({
    userListPage,
    editUserPage,
    browser,
    mainLocation,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(formData.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(formData.username).click();
    });

    await test.step('Add "Admin" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Admin').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newUserPage = await newUserCtx.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        formData.username,
        formData.password
      );
      await newUserLoginPage.loginButton.click();
    });

    await test.step('Assert created ward on location chooser, log in, admin', async () => {
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    });

    await test.step('Select main location in location chooser', async () => {
      const location = await mainLocation.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, admin', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.getNavItem('Dashboard').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await test.step('Assert created ward on location chooser, gsp, admin', async () => {
      await newPageNavbar.configurationButton.click();
      await newPageNavbar.getNavItem('Locations').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await newUserCtx.close();
  });

  test('Assert created Ward on location chooser, manager role', async ({
    userListPage,
    editUserPage,
    browser,
    mainLocation,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(formData.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(formData.username).click();
    });

    await test.step('Add "Manager" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection
        .deleteDefaultRole('Admin')
        .click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Manager').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newUserPage = await newUserCtx.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        formData.username,
        formData.password
      );
      await newUserLoginPage.loginButton.click();
    });

    await test.step('Assert created ward on location chooser, log in, manager', async () => {
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    });

    await test.step('Select main location in location chooser', async () => {
      const location = await mainLocation.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, manager', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.getNavItem('Dashboard').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await test.step('Assert created ward on location chooser, gsp, manager', async () => {
      await newPageNavbar.profileButton.click();
      await newPageNavbar.editProfileButton.click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await newUserCtx.close();
  });

  test('Assert created Ward on location chooser, browser role', async ({
    userListPage,
    editUserPage,
    browser,
    mainLocation,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(formData.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(formData.username).click();
    });

    await test.step('Add "Browser" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection
        .deleteDefaultRole('Manager')
        .click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Browser').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newUserPage = await newUserCtx.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        formData.username,
        formData.password
      );
      await newUserLoginPage.loginButton.click();
    });

    await test.step('Assert created ward on location chooser, log in, browser', async () => {
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    });

    await test.step('Select main location in location chooser', async () => {
      const location = await mainLocation.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, browser', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.getNavItem('Dashboard').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await test.step('Assert created ward on location chooser, gsp, browser', async () => {
      await newPageNavbar.profileButton.click();
      await newPageNavbar.editProfileButton.click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await newUserCtx.close();
  });
});

test.describe('Check if ward location is present in location chooser based on users permissions, global requestor', () => {
  const LOCATION_NAME = 'E2E-test-Ward';

  test.beforeAll(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      editUserPage,
      userListPage,
      createUserPage,
    }) => {
      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create Ward location', async () => {
        await createLocationPage.locationDetailsTabSection.locationName.fill(
          LOCATION_NAME
        );
        await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
        await createLocationPage.locationDetailsTabSection
          .getlocationTypeOption('Ward')
          .click();
        await createLocationPage.locationDetailsTabSection.saveButton.click();
        await createLocationPage.locationConfigurationTab.click();
        await createLocationPage.locationConfigurationTabSection.useDefaultSettingsCheckbox.uncheck();
        await createLocationPage.locationConfigurationTabSection
          .removeSupportedActivities('None')
          .click();
        await createLocationPage.locationConfigurationTabSection.supportedActivities.click();
        await createLocationPage.locationConfigurationTabSection
          .getSupportedActivities('Submit request')
          .click();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });

      await test.step('Go to create user page', async () => {
        await page.goto('./dashboard');
        await navbar.configurationButton.click();
        await navbar.getNavItem('Users').click();
        await userListPage.createUserButton.click();
      });

      await test.step('Create new test user', async () => {
        await createUserPage.fillUserForm(formData);
        await createUserPage.saveButton.click();
        await expect(editUserPage.summary).toContainText(
          `${formData.firstName} ${formData.lastName}`
        );
        await editUserPage.userDetailsTabSection.activateUserCheckBox.click();
        await editUserPage.userDetailsTabSection.saveButton.click();
      });

      await test.step('Add global requestor user role', async () => {
        await editUserPage.authorizationTab.click();
        await editUserPage.authorizationTabSection.defaultRoleSelect.click();
        await editUserPage.authorizationTabSection
          .getUserRole('Requestor')
          .click();
        await editUserPage.authorizationTabSection.saveButton.click();
      });
    }
  );

  test.afterAll(
    async ({
      page,
      navbar,
      editUserPage,
      locationListPage,
      createLocationPage,
      userListPage,
    }) => {
      await page.goto('./dashboard');
      await test.step('Go to edit user page', async () => {
        await userListPage.goToPage();
        await userListPage.searchByNameField.fill(formData.username);
        await userListPage.findButton.click();
        await userListPage.getUserToEdit(formData.username).click();
      });

      await test.step('Delete user', async () => {
        await editUserPage.actionButton.click();
        await editUserPage.clickDeleteUser();
      });

      await test.step('Assert that user does not exists in the list', async () => {
        await userListPage.searchByNameField.fill(formData.username);
        await userListPage.findButton.click();
        await expect(
          userListPage.getUserToEdit(formData.username)
        ).toBeHidden();
      });

      await test.step('Delete created ward location', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationToEdit(LOCATION_NAME)
        ).toBeHidden();
      });
    }
  );

  test('Assert created Ward on location chooser, admin role', async ({
    userListPage,
    editUserPage,
    browser,
    mainLocation,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(formData.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(formData.username).click();
    });

    await test.step('Add "Admin" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Admin').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newUserPage = await newUserCtx.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        formData.username,
        formData.password
      );
      await newUserLoginPage.loginButton.click();
    });

    await test.step('Assert created ward on location chooser, log in, admin', async () => {
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    });

    await test.step('Select main location in location chooser', async () => {
      const location = await mainLocation.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, admin', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.getNavItem('Dashboard').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await test.step('Assert created ward on location chooser, gsp, admin', async () => {
      await newPageNavbar.configurationButton.click();
      await newPageNavbar.getNavItem('Locations').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await newUserCtx.close();
  });

  test('Assert created Ward on location chooser, manager role', async ({
    userListPage,
    editUserPage,
    browser,
    mainLocation,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(formData.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(formData.username).click();
    });

    await test.step('Add "Manager" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection
        .deleteDefaultRole('Admin')
        .click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Manager').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newUserPage = await newUserCtx.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        formData.username,
        formData.password
      );
      await newUserLoginPage.loginButton.click();
    });

    await test.step('Assert created ward on location chooser, log in, manager', async () => {
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    });

    await test.step('Select main location in location chooser', async () => {
      const location = await mainLocation.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, manager', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.getNavItem('Dashboard').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await test.step('Assert created ward on location chooser, gsp, manager', async () => {
      await newPageNavbar.profileButton.click();
      await newPageNavbar.editProfileButton.click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        locationChooser.getOrganization('No organization')
      ).toBeVisible();
      await locationChooser.getOrganization('No organization').click();
      await expect(
        locationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await locationChooser.closeLocationChooserButton.click();
    });

    await newUserCtx.close();
  });
});

test.describe('Check if ward location is present in location chooser based on users permissions, location specific permission, impersonate mode', () => {
  const LOCATION_NAME = 'E2E-test-Ward';

  test.beforeAll(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      editUserPage,
      userListPage,
      createUserPage,
    }) => {
      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create Ward location', async () => {
        await createLocationPage.locationDetailsTabSection.locationName.fill(
          LOCATION_NAME
        );
        await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
        await createLocationPage.locationDetailsTabSection
          .getlocationTypeOption('Ward')
          .click();
        await createLocationPage.locationDetailsTabSection.saveButton.click();
        await createLocationPage.locationConfigurationTab.click();
        await createLocationPage.locationConfigurationTabSection.useDefaultSettingsCheckbox.uncheck();
        await createLocationPage.locationConfigurationTabSection
          .removeSupportedActivities('None')
          .click();
        await createLocationPage.locationConfigurationTabSection.supportedActivities.click();
        await createLocationPage.locationConfigurationTabSection
          .getSupportedActivities('Submit request')
          .click();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });

      await test.step('Go to create user page', async () => {
        await page.goto('./dashboard');
        await navbar.configurationButton.click();
        await navbar.getNavItem('Users').click();
        await userListPage.createUserButton.click();
      });

      await test.step('Create new test user', async () => {
        await createUserPage.fillUserForm(formData);
        await createUserPage.saveButton.click();
        await expect(editUserPage.summary).toContainText(
          `${formData.firstName} ${formData.lastName}`
        );
        await editUserPage.userDetailsTabSection.activateUserCheckBox.click();
        await editUserPage.userDetailsTabSection.saveButton.click();
      });

      await test.step('Add user role for created Ward location', async () => {
        await editUserPage.authorizationTab.click();
        await editUserPage.authorizationTabSection.addLocationRolesButton.click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationSelectClearButton.click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationForLocationRoleSelect.click();
        await editUserPage.authorizationTabSection.locationRoleDialog
          .getLocationForLocationRole(LOCATION_NAME)
          .click();
        await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
        await editUserPage.authorizationTabSection.locationRoleDialog
          .getUserLocationRole('Requestor')
          .click();
        await editUserPage.authorizationTabSection.locationRoleDialog.saveButton.click();
      });
    }
  );

  test.afterAll(
    async ({
      page,
      navbar,
      editUserPage,
      locationListPage,
      createLocationPage,
      userListPage,
    }) => {
      await page.goto('./dashboard');
      await test.step('Go to edit user page', async () => {
        await userListPage.goToPage();
        await userListPage.searchByNameField.fill(formData.username);
        await userListPage.findButton.click();
        await userListPage.getUserToEdit(formData.username).click();
      });

      await test.step('Remove location role from user', async () => {
        await editUserPage.authorizationTab.click();
        await editUserPage.authorizationTabSection
          .deleteLocationRole(LOCATION_NAME)
          .click();
      });

      await test.step('Delete user', async () => {
        await editUserPage.actionButton.click();
        await editUserPage.clickDeleteUser();
      });

      await test.step('Assert that user does not exists in the list', async () => {
        await userListPage.searchByNameField.fill(formData.username);
        await userListPage.findButton.click();
        await expect(
          userListPage.getUserToEdit(formData.username)
        ).toBeHidden();
      });

      await test.step('Delete created ward location', async () => {
        await navbar.configurationButton.click();
        await navbar.getNavItem('Locations').click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await locationListPage.getLocationToEdit(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationToEdit(LOCATION_NAME)
        ).toBeHidden();
      });
    }
  );

  test('Assert created Ward on location chooser in impersonate mode', async ({
    userListPage,
    editUserPage,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(formData.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(formData.username).click();
    });

    await test.step('Add "Manager" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Manager').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newPage = await editUserPage.clickImpersonateButton();
    const impersonateBanner = new ImpersonateBanner(newPage);
    const newPageNavbar = new Navbar(newPage);
    const newPageLocationChooser = new LocationChooser(newPage);

    await test.step('Assert created ward on location chooser in impersonate mode, react', async () => {
      await newPage.goto('./dashboard');
      await newPageNavbar.getNavItem('Dashboard').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        newPageLocationChooser.getOrganization('No organization')
      ).toBeVisible();
      await newPageLocationChooser.getOrganization('No organization').click();
      await expect(
        newPageLocationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(newPageLocationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await newPageLocationChooser.closeLocationChooserButton.click();
    });

    await test.step('Assert created ward on location chooser in impersonate mode, gsp', async () => {
      await newPageNavbar.getNavItem('Purchasing').click();
      await newPageNavbar.getNavItem('List Suppliers').click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        newPageLocationChooser.getOrganization('No organization')
      ).toBeVisible();
      await newPageLocationChooser.getOrganization('No organization').click();
      await expect(
        newPageLocationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(newPageLocationChooser.getLocation(LOCATION_NAME)).toBeVisible();
      await newPageLocationChooser.closeLocationChooserButton.click();
    });

    await test.step('log out from impersonate mode', async () => {
      await impersonateBanner.logoutButton.click();
      expect(impersonateBanner.isLoaded(formData.username)).rejects.toThrow();
    });

    await newPage.close();
  });
});
