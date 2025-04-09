import ImpersonateBanner from '@/components/ImpersonateBanner';
import LocationChooser from '@/components/LocationChooser';
import Navbar from '@/components/Navbar';
import AppConfig from '@/config/AppConfig';
import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
import { expect, test } from '@/fixtures/fixtures';
import LoginPage from '@/pages/LoginPage';
import { CreateUserType } from '@/types';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Check if ward location is present in location chooser based on users permissions, location specific permission', () => {
  const uniqueIdentifier = new UniqueIdentifier();

  let TEST_USER: CreateUserType;

  const LOCATION_NAME = uniqueIdentifier.generateUniqueString('Test-Ward');

  test.beforeEach(
    async ({
      page,
      navbar,
      locationListPage,
      userListPage,
      createUserPage,
      editUserPage,
      locationService,
    }) => {
      TEST_USER = {
        username: uniqueIdentifier.generateUniqueString('user'),
        firstName: 'user_firstanme',
        lastName: 'user_lastname',
        password: 'testpassword123',
      };

      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.locations.click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create Ward location', async () => {
        const { data: locationTypes } =
          await locationService.getLocationTypes();
        const locationType = locationTypes.find(
          (it) => it.locationTypeCode == LocationTypeCode.WARD
        );
        await locationService.createLocation({
          active: true,
          name: LOCATION_NAME,
          locationType: locationType,
          supportedActivities: [ActivityCode.SUBMIT_REQUEST],
        });
      });

      await test.step('Go to create user page', async () => {
        await page.goto('./dashboard');
        await navbar.configurationButton.click();
        await navbar.users.click();
        await userListPage.createUserButton.click();
      });

      await test.step('Create new test user', async () => {
        await createUserPage.fillUserForm(TEST_USER);
        await createUserPage.saveButton.click();
        await expect(editUserPage.summary).toContainText(
          `${TEST_USER.firstName} ${TEST_USER.lastName}`
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

  test.afterEach(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      userListPage,
      editUserPage,
    }) => {
      await page.goto('./dashboard');
      await test.step('Go to edit user page', async () => {
        await userListPage.goToPage();
        await userListPage.searchByNameField.fill(TEST_USER.username);
        await userListPage.findButton.click();
        await userListPage.getUserToEdit(TEST_USER.username).click();
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
        await userListPage.searchByNameField.fill(TEST_USER.username);
        await userListPage.findButton.click();
        await expect(
          userListPage.getUserToEdit(TEST_USER.username)
        ).toBeHidden();
      });

      await test.step('Delete created ward location', async () => {
        await navbar.configurationButton.click();
        await navbar.locations.click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await locationListPage.getLocationEditButton(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationEditButton(LOCATION_NAME)
        ).toBeHidden();
      });
    }
  );

  test('Assert created Ward on location chooser, admin role', async ({
    userListPage,
    editUserPage,
    emptyUserContext,
    mainLocationService,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(TEST_USER.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(TEST_USER.username).click();
    });

    await test.step('Add "Admin" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Admin').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserPage = await emptyUserContext.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        TEST_USER.username,
        TEST_USER.password
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
      const location = await mainLocationService.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, admin', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.dashboard.click();
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
      await newPageNavbar.locations.click();
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
  });

  test('Assert created Ward on location chooser, manager role', async ({
    userListPage,
    editUserPage,
    emptyUserContext,
    mainLocationService,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(TEST_USER.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(TEST_USER.username).click();
    });

    await test.step('Add "Manager" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Manager').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserPage = await emptyUserContext.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        TEST_USER.username,
        TEST_USER.password
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
      const location = await mainLocationService.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, manager', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.dashboard.click();
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
  });

  test('Assert created Ward on location chooser, browser role', async ({
    userListPage,
    editUserPage,
    mainLocationService,
    emptyUserContext,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(TEST_USER.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(TEST_USER.username).click();
    });

    await test.step('Add "Browser" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Browser').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserPage = await emptyUserContext.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        TEST_USER.username,
        TEST_USER.password
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
      const location = await mainLocationService.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, browser', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.dashboard.click();
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
  });
});

test.describe('Check if ward location is present in location chooser based on users permissions, global requestor', () => {
  const uniqueIdentifier = new UniqueIdentifier();

  let TEST_USER: CreateUserType;

  const LOCATION_NAME = uniqueIdentifier.generateUniqueString('Test-Ward');

  test.beforeEach(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      userListPage,
      createUserPage,
      editUserPage,
    }) => {
      TEST_USER = {
        username: uniqueIdentifier.generateUniqueString('user'),
        firstName: 'user_firstanme',
        lastName: 'user_lastname',
        password: 'testpassword123',
      };

      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.locations.click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create Ward location', async () => {
        await createLocationPage.locationDetailsTabSection.locationNameField.fill(
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
          .removeSupportedActivitiesButton('None')
          .click();
        await createLocationPage.locationConfigurationTabSection.supportedActivitiesSelect.click();
        await createLocationPage.locationConfigurationTabSection
          .getSupportedActivitiesOption('Submit request')
          .click();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });

      await test.step('Go to create user page', async () => {
        await page.goto('./dashboard');
        await navbar.configurationButton.click();
        await navbar.users.click();
        await userListPage.createUserButton.click();
      });

      await test.step('Create new test user', async () => {
        await createUserPage.fillUserForm(TEST_USER);
        await createUserPage.saveButton.click();
        await expect(editUserPage.summary).toContainText(
          `${TEST_USER.firstName} ${TEST_USER.lastName}`
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

  test.afterEach(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      userListPage,
      editUserPage,
    }) => {
      await page.goto('./dashboard');
      await test.step('Go to edit user page', async () => {
        await userListPage.goToPage();
        await userListPage.searchByNameField.fill(TEST_USER.username);
        await userListPage.findButton.click();
        await userListPage.getUserToEdit(TEST_USER.username).click();
      });

      await test.step('Delete user', async () => {
        await editUserPage.actionButton.click();
        await editUserPage.clickDeleteUser();
      });

      await test.step('Assert that user does not exists in the list', async () => {
        await userListPage.searchByNameField.fill(TEST_USER.username);
        await userListPage.findButton.click();
        await expect(
          userListPage.getUserToEdit(TEST_USER.username)
        ).toBeHidden();
      });

      await test.step('Delete created ward location', async () => {
        await navbar.configurationButton.click();
        await navbar.locations.click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await locationListPage.getLocationEditButton(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationEditButton(LOCATION_NAME)
        ).toBeHidden();
      });
    }
  );

  test('Assert created Ward on location chooser, admin role', async ({
    userListPage,
    editUserPage,
    emptyUserContext,
    mainLocationService,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(TEST_USER.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(TEST_USER.username).click();
    });

    await test.step('Add "Admin" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Admin').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserPage = await emptyUserContext.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        TEST_USER.username,
        TEST_USER.password
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
      const location = await mainLocationService.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, admin', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.dashboard.click();
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
      await newPageNavbar.locations.click();
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
  });

  test('Assert created Ward on location chooser, manager role', async ({
    userListPage,
    editUserPage,
    emptyUserContext,
    mainLocationService,
  }) => {
    await test.step('Go to edit user page', async () => {
      await userListPage.goToPage();
      await userListPage.searchByNameField.fill(TEST_USER.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(TEST_USER.username).click();
    });

    await test.step('Add "Manager" role', async () => {
      await editUserPage.authorizationTab.click();
      await editUserPage.authorizationTabSection.defaultRoleSelect.click();
      await editUserPage.authorizationTabSection.getUserRole('Manager').click();
      await editUserPage.authorizationTabSection.saveButton.click();
    });

    const newUserPage = await emptyUserContext.newPage();
    const newUserLoginPage = new LoginPage(newUserPage);
    const locationChooser = new LocationChooser(newUserPage);
    const newPageNavbar = new Navbar(newUserPage);

    await test.step('Login as new created user', async () => {
      await newUserLoginPage.goToPage();
      await newUserLoginPage.fillLoginForm(
        TEST_USER.username,
        TEST_USER.password
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
      const location = await mainLocationService.getLocation();
      await locationChooser
        .getOrganization(location.organization?.name)
        .click();
      await locationChooser.getLocation(location.name).click();
    });

    await test.step('Assert created ward on location chooser, react, manager', async () => {
      await newUserPage.goto('./dashboard');
      await newPageNavbar.dashboard.click();
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
  });
});

test.describe('Check if ward location is present in location chooser based on users permissions, location specific permission, impersonate mode', () => {
  test.use({ storageState: AppConfig.instance.users.impersonator.storagePath });

  const uniqueIdentifier = new UniqueIdentifier();

  let TEST_USER: CreateUserType;

  let LOCATION_NAME: string;

  test.beforeEach(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      userListPage,
      editUserPage,
      createUserPage,
    }) => {
      TEST_USER = {
        username: uniqueIdentifier.generateUniqueString('user'),
        firstName: 'user_firstanme',
        lastName: 'user_lastname',
        password: 'testpassword123',
      };

      LOCATION_NAME = uniqueIdentifier.generateUniqueString('Test-Ward');

      await page.goto('./dashboard');

      await test.step('Go to create location page', async () => {
        await navbar.configurationButton.click();
        await navbar.locations.click();
        await locationListPage.createLocationButton.click();
      });

      await test.step('Create Ward location', async () => {
        await createLocationPage.locationDetailsTabSection.locationNameField.fill(
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
          .removeSupportedActivitiesButton('None')
          .click();
        await createLocationPage.locationConfigurationTabSection.supportedActivitiesSelect.click();
        await createLocationPage.locationConfigurationTabSection
          .getSupportedActivitiesOption('Submit request')
          .click();
        await createLocationPage.locationConfigurationTabSection.saveButton.click();
      });

      await test.step('Go to create user page', async () => {
        await page.goto('./dashboard');
        await navbar.configurationButton.click();
        await navbar.users.click();
        await userListPage.createUserButton.click();
      });

      await test.step('Create new test user', async () => {
        await createUserPage.fillUserForm(TEST_USER);
        await createUserPage.saveButton.click();
        await expect(editUserPage.summary).toContainText(
          `${TEST_USER.firstName} ${TEST_USER.lastName}`
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

  test.afterEach(
    async ({
      page,
      navbar,
      locationListPage,
      createLocationPage,
      userListPage,
      editUserPage,
    }) => {
      await page.goto('./dashboard');
      await test.step('Go to edit user page', async () => {
        await userListPage.goToPage();
        await userListPage.searchByNameField.fill(TEST_USER.username);
        await userListPage.findButton.click();
        await userListPage.getUserToEdit(TEST_USER.username).click();
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
        await userListPage.searchByNameField.fill(TEST_USER.username);
        await userListPage.findButton.click();
        await expect(
          userListPage.getUserToEdit(TEST_USER.username)
        ).toBeHidden();
      });

      await test.step('Delete created ward location', async () => {
        await navbar.configurationButton.click();
        await navbar.locations.click();
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await locationListPage.getLocationEditButton(LOCATION_NAME).click();
        await createLocationPage.actionButton.click();
        await createLocationPage.clickDeleteLocation();
      });

      await test.step('Assert that location does not exists in the list', async () => {
        await locationListPage.searchByLocationNameField.fill(LOCATION_NAME);
        await locationListPage.locationTypeSelect.click();
        await locationListPage.getSelectLocationTypeOption('Ward').click();
        await locationListPage.findButton.click();
        await expect(
          locationListPage.getLocationEditButton(LOCATION_NAME)
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
      await userListPage.searchByNameField.fill(TEST_USER.username);
      await userListPage.findButton.click();
      await userListPage.getUserToEdit(TEST_USER.username).click();
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
      await newPageNavbar.dashboard.click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        newPageLocationChooser.getOrganization('No organization')
      ).toBeVisible();
      await newPageLocationChooser.getOrganization('No organization').click();
      await expect(
        newPageLocationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(
        newPageLocationChooser.getLocation(LOCATION_NAME)
      ).toBeVisible();
      await newPageLocationChooser.closeLocationChooserButton.click();
    });

    await test.step('Assert created ward on location chooser in impersonate mode, gsp', async () => {
      await newPageNavbar.purchasing.click();
      await newPageNavbar.listSuppliers.click();
      await newPageNavbar.locationChooserButton.click();
      await expect(
        newPageLocationChooser.getOrganization('No organization')
      ).toBeVisible();
      await newPageLocationChooser.getOrganization('No organization').click();
      await expect(
        newPageLocationChooser.getLocationGroup('No location Group')
      ).toBeVisible();
      await expect(
        newPageLocationChooser.getLocation(LOCATION_NAME)
      ).toBeVisible();
      await newPageLocationChooser.closeLocationChooserButton.click();
    });

    await test.step('log out from impersonate mode', async () => {
      await impersonateBanner.logoutButton.click();
      expect(impersonateBanner.isLoaded(TEST_USER.username)).rejects.toThrow();
    });

    await newPage.close();
  });
});
