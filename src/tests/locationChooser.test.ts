import { expect, test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';

const depotLocationName = 'DepotLocation';
const wardLocationName = 'WardLocation';

test.beforeEach(async ({ page }) => {
  await test.step('Go to dashboard', async () => {
    await page.goto('./dashboard');
  });
});

//tests are covering all steps from test case OBPIH-4644 Location Chooser
test('Create location and  assert it on location chooser', async ({
  navbar,
  locationListPage,
  organizationListPage,
  createOrganizationPage,
  editOrganizationPage,
  locationGroupsListPage,
  createLocationGroupPage,
  createLocationPage,
  locationChooser,
  editLocationGroupPage,
  loginPage,
  mainLocation,
}) => {
  await test.step('Go to create organization page', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Organizations').click();
    await organizationListPage.createOrganizationButton.click();
  });

  await test.step('Create organization', async () => {
    await createOrganizationPage.organizationNameField.fill(
      'Create Organization Test'
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
    await createLocationGroupPage.locationGroupNameField.fill(
      'Location Group test1'
    );
    await createLocationGroupPage.createButton.click();
  });

  await test.step('Go to create location page', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.createLocationButton.click();
  });

  await test.step('Create location, Depot with background color', async () => {
    await createLocationPage.locationDetailsTabSection.locationName.fill(
      depotLocationName
    );
    await createLocationPage.locationDetailsTabSection.organizationSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getOrganization('Create Organization Test')
      .click();
    await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getlocationType('Depot')
      .click();
    await createLocationPage.locationDetailsTabSection.locationGroupSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getLocationGroup('Location Group test1')
      .click();
    await createLocationPage.locationDetailsTabSection.saveButton.click();
    await createLocationPage.locationConfigurationTab.click();
    await createLocationPage.locationConfigurationTabSection.backgroundColorField.click();
    await createLocationPage.locationConfigurationTabSection.backgroundColorField.clear();
    await createLocationPage.locationConfigurationTabSection.backgroundColorField.fill(
      '#009dd1'
    );
    await createLocationPage.locationConfigurationTabSection.saveButton.click();
  });

  await test.step('Assert created location on location chooser, gsp page', async () => {
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('Create Organization Test')
    ).toBeVisible();
    await locationChooser.getOrganization('Create Organization Test').click();
    await expect(
      locationChooser.getLocationGroup('Location Group test1')
    ).toBeVisible();
    await expect(locationChooser.getLocation(depotLocationName)).toBeVisible();
    //await expect(locationChooser.getLocation(depotLocationName)).toHaveCSS('location-color', 'rgb(0, 157, 209)');
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert created location on location chooser, react page', async () => {
    await navbar.getNavItem('Dashboard').click();
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('Create Organization Test')
    ).toBeVisible();
    await locationChooser.getOrganization('Create Organization Test').click();
    await expect(
      locationChooser.getLocationGroup('Location Group test1')
    ).toBeVisible();
    await expect(locationChooser.getLocation(depotLocationName)).toBeVisible();
    //await expect(locationChooser.getLocation(depotLocationName)).toHaveCSS('location-color', 'rgb(0, 157, 209)');
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert created location on location chooser, log in', async () => {
    await navbar.profileButton.click();
    await navbar.logoutButton.click();
    await loginPage.fillLoginForm(
      AppConfig.instance.users.main.username,
      AppConfig.instance.users.main.password
    );
    await loginPage.loginButton.click();
    await expect(
      locationChooser.getOrganization('Create Organization Test')
    ).toBeVisible();
    await locationChooser.getOrganization('Create Organization Test').click();
    await expect(
      locationChooser.getLocationGroup('Location Group test1')
    ).toBeVisible();
    await expect(locationChooser.getLocation(depotLocationName)).toBeVisible();
    await expect(locationChooser.yourLastSingInInfo).toBeVisible();
    //await expect(locationChooser.getLocation(depotLocationName)).toHaveCSS('location-color', 'rgb(0, 157, 209)');
    await locationChooser.getLocation(depotLocationName).click();
    await navbar.locationChooserButton.click();
    const location = await mainLocation.getLocation();
    await locationChooser.getLocation(location.name).click();
  });

  await test.step('Delete created location', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.searchByLocationNameField.fill(depotLocationName);
    await locationListPage.findButton.click();
    await locationListPage.getLocationToEdit(depotLocationName).click();
    await createLocationPage.actionButton.click();
    await createLocationPage.clickDeleteLocation();
  });

  await test.step('Assert that location does not exists in the list', async () => {
    await locationListPage.searchByLocationNameField.fill(depotLocationName);
    await locationListPage.findButton.click();
    await expect(
      locationListPage.getLocationToEdit(depotLocationName)
    ).toBeHidden();
  });

  await test.step('Delete created organization', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Organizations').click();
    await organizationListPage.searchByOrganizationNameField.fill(
      'Create Organization Test'
    );
    await organizationListPage.searchButton.click();
    await organizationListPage
      .getOrganizationToEdit('Create Organization Test')
      .click();
    await editOrganizationPage.clickDeleteOrganization();
  });

  await test.step('Assert that organization does not exists in the list', async () => {
    await organizationListPage.searchByOrganizationNameField.fill(
      'Create Organization Test'
    );
    await organizationListPage.searchButton.click();
    await expect(
      organizationListPage.getOrganizationToEdit('Create Organization Test')
    ).toBeHidden();
  });

  await test.step('Delete created location group', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Location groups').click();
    await locationGroupsListPage.getusePagination('3').click();
    await locationGroupsListPage
      .getLocationGroupnToEdit('Location Group test1')
      .click();
    await editLocationGroupPage.clickDeleteLocationGroup();
  });
});

test('Create ward location, add location role and  assert it on location chooser', async ({
  navbar,
  locationListPage,
  createLocationPage,
  locationChooser,
  editUserPage,
  loginPage,
  mainLocation,
}) => {
  await test.step('Go to create location page', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.createLocationButton.click();
  });

  await test.step('Create Ward location', async () => {
    await createLocationPage.locationDetailsTabSection.locationName.fill(
      wardLocationName
    );
    await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getlocationType('Ward')
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
      .getLocationForLocationRole(wardLocationName)
      .click();
    await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
    await editUserPage.authorizationTabSection.locationRoleDialog
      .getUserLocationRole('Requestor')
      .click();
    await editUserPage.authorizationTabSection.locationRoleDialog.saveButton.click();
  });

  await test.step('Assert created Ward on location chooser, gsp page', async () => {
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('No organization')
    ).toBeVisible();
    await locationChooser.getOrganization('No organization').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(wardLocationName)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert created Ward on location chooser, react page', async () => {
    await navbar.getNavItem('Dashboard').click();
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('No organization')
    ).toBeVisible();
    await locationChooser.getOrganization('No organization').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(wardLocationName)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert created Ward on location chooser, log in', async () => {
    await navbar.profileButton.click();
    await navbar.logoutButton.click();
    await loginPage.fillLoginForm(
      AppConfig.instance.users.main.username,
      AppConfig.instance.users.main.password
    );
    await loginPage.loginButton.click();
    await expect(
      locationChooser.getOrganization('No organization')
    ).toBeVisible();
    await locationChooser.getOrganization('No organization').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(wardLocationName)).toBeVisible();
    await expect(locationChooser.yourLastSingInInfo).toBeVisible();
    await expect(locationChooser.locationChooserLogoutButton).toBeVisible();
    const location = await mainLocation.getLocation();
    await locationChooser.getOrganization(location.organization?.name).click();
    await locationChooser.getLocation(location.name).click();
  });

  await test.step('Remove location role from user', async () => {
    await navbar.profileButton.click();
    await navbar.editProfileButton.click();
    await editUserPage.authorizationTabSection
      .deleteLocationRole(wardLocationName)
      .click();
  });

  await test.step('Delete created ward location', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.searchByLocationNameField.fill(wardLocationName);
    await locationListPage.locationTypeSelect.click();
    await locationListPage.getSelectLocationType('Ward').click();
    await locationListPage.findButton.click();
    await locationListPage.getLocationToEdit(wardLocationName).click();
    await createLocationPage.actionButton.click();
    await createLocationPage.clickDeleteLocation();
  });

  await test.step('Assert that location does not exists in the list', async () => {
    await locationListPage.searchByLocationNameField.fill(wardLocationName);
    await locationListPage.locationTypeSelect.click();
    await locationListPage.getSelectLocationType('Ward').click();
    await locationListPage.findButton.click();
    await expect(
      locationListPage.getLocationToEdit(wardLocationName)
    ).toBeHidden();
  });
});

test('Create location, edit its organization and assert on location chooser', async ({
  navbar,
  locationListPage,
  organizationListPage,
  createOrganizationPage,
  editOrganizationPage,
  createLocationPage,
  locationChooser,
  loginPage,
  mainLocation,
}) => {
  await test.step('Go to create organization page', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Organizations').click();
    await organizationListPage.createOrganizationButton.click();
  });

  await test.step('Create organization', async () => {
    await createOrganizationPage.organizationNameField.fill(
      'Create Organization Test1'
    );
    await createOrganizationPage.createButton.click();
    await expect(
      editOrganizationPage.createOrganizationSuccessMessage
    ).toBeVisible();
  });

  await test.step('Create second organization', async () => {
    await editOrganizationPage.createOrganizationButton.click();
    await createOrganizationPage.organizationNameField.fill(
      'Create Organization Test2'
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
      depotLocationName
    );
    await createLocationPage.locationDetailsTabSection.organizationSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getOrganization('Create Organization Test1')
      .click();
    await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getlocationType('Depot')
      .click();
    await createLocationPage.locationDetailsTabSection.saveButton.click();
  });

  await test.step('Assert created location on location chooser', async () => {
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('Create Organization Test1')
    ).toBeVisible();
    await locationChooser.getOrganization('Create Organization Test1').click();
    await expect(
      locationChooser.getLocationGroup('No Location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(depotLocationName)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Edit locations organization', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.searchByLocationNameField.fill(depotLocationName);
    await locationListPage.findButton.click();
    await locationListPage.getLocationToEdit(depotLocationName).click();
    await createLocationPage.locationDetailsTabSection.organizationSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getOrganization('Create Organization Test2')
      .click();
    await createLocationPage.locationDetailsTabSection.saveButton.click();
  });

  await test.step('Assert updated organization for location on location chooser, gsp page', async () => {
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('Create Organization Test1')
    ).toBeHidden();
    await expect(
      locationChooser.getOrganization('Create Organization Test2')
    ).toBeVisible();
    await locationChooser.getOrganization('Create Organization Test2').click();
    await expect(
      locationChooser.getLocationGroup('No Location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(depotLocationName)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert updated organization for location on location chooser, react page', async () => {
    await navbar.getNavItem('Dashboard').click();
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('Create Organization Test1')
    ).toBeHidden();
    await expect(
      locationChooser.getOrganization('Create Organization Test2')
    ).toBeVisible();
    await locationChooser.getOrganization('Create Organization Test2').click();
    await expect(
      locationChooser.getLocationGroup('No Location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(depotLocationName)).toBeVisible();
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert created Ward on location chooser, log in', async () => {
    await navbar.profileButton.click();
    await navbar.logoutButton.click();
    await loginPage.fillLoginForm(
      AppConfig.instance.users.main.username,
      AppConfig.instance.users.main.password
    );
    await loginPage.loginButton.click();
    await expect(
      locationChooser.getOrganization('Create Organization Test1')
    ).toBeHidden();
    await expect(
      locationChooser.getOrganization('Create Organization Test2')
    ).toBeVisible();
    await locationChooser.getOrganization('Create Organization Test2').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(depotLocationName)).toBeVisible();
    await expect(locationChooser.yourLastSingInInfo).toBeVisible();
    await expect(locationChooser.locationChooserLogoutButton).toBeVisible();
    const location = await mainLocation.getLocation();
    await locationChooser.getOrganization(location.organization?.name).click();
    await locationChooser.getLocation(location.name).click();
  });

  await test.step('Delete created location', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.searchByLocationNameField.fill(depotLocationName);
    await locationListPage.findButton.click();
    await locationListPage.getLocationToEdit(depotLocationName).click();
    await createLocationPage.actionButton.click();
    await createLocationPage.clickDeleteLocation();
  });

  await test.step('Assert that location does not exists in the list', async () => {
    await locationListPage.searchByLocationNameField.fill(depotLocationName);
    await locationListPage.findButton.click();
    await expect(
      locationListPage.getLocationToEdit(depotLocationName)
    ).toBeHidden();
  });

  await test.step('Delete created organizations', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Organizations').click();
    await organizationListPage.searchByOrganizationNameField.fill(
      'Create Organization Test1'
    );
    await organizationListPage.searchButton.click();
    await organizationListPage
      .getOrganizationToEdit('Create Organization Test1')
      .click();
    await editOrganizationPage.clickDeleteOrganization();
    await organizationListPage.searchByOrganizationNameField.fill(
      'Create Organization Test2'
    );
    await organizationListPage.searchButton.click();
    await organizationListPage
      .getOrganizationToEdit('Create Organization Test2')
      .click();
    await editOrganizationPage.clickDeleteOrganization();
  });

  await test.step('Assert that organizations do not exists in the list', async () => {
    await organizationListPage.searchByOrganizationNameField.fill(
      'Create Organization Test1'
    );
    await organizationListPage.searchButton.click();
    await expect(
      organizationListPage.getOrganizationToEdit('Create Organization Test1')
    ).toBeHidden();
    await organizationListPage.searchByOrganizationNameField.clear();
    await organizationListPage.searchByOrganizationNameField.fill(
      'Create Organization Test2'
    );
    await organizationListPage.searchButton.click();
    await expect(
      organizationListPage.getOrganizationToEdit('Create Organization Test2')
    ).toBeHidden();
  });
});

test('Create no manage inventory depot and asser it on location chooser', async ({
  navbar,
  locationListPage,
  createLocationPage,
  locationChooser,
  loginPage,
  mainLocation,
}) => {
  await test.step('Go to create location page', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.createLocationButton.click();
  });

  await test.step('Create location, Depot without manage inventory', async () => {
    await createLocationPage.locationDetailsTabSection.locationName.fill(
      depotLocationName
    );
    await createLocationPage.locationDetailsTabSection.organizationSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getOrganization('1000bulbs.com')
      .click();
    await createLocationPage.locationDetailsTabSection.locationTypeSelect.click();
    await createLocationPage.locationDetailsTabSection
      .getlocationType('Depot')
      .click();
    await createLocationPage.locationDetailsTabSection.saveButton.click();
    await createLocationPage.locationConfigurationTab.click();
    await createLocationPage.locationConfigurationTabSection.useDefaultSettingsCheckbox.uncheck();
    await createLocationPage.locationConfigurationTabSection
      .removeSupportedActivities('Manage inventory')
      .click();
    await createLocationPage.locationConfigurationTabSection.saveButton.click();
  });

  await test.step('Assert created location on location chooser, gsp page', async () => {
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('1000bulbs.com')
    ).toBeVisible();
    await locationChooser.getOrganization('1000bulbs.com').click();
    await expect(locationChooser.getLocation(depotLocationName)).toBeHidden();
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert created location on location chooser, react page', async () => {
    await navbar.getNavItem('Dashboard').click();
    await navbar.locationChooserButton.click();
    await expect(
      locationChooser.getOrganization('1000bulbs.com')
    ).toBeVisible();
    await locationChooser.getOrganization('1000bulbs.com').click();
    await expect(locationChooser.getLocation(depotLocationName)).toBeHidden();
    await locationChooser.closeLocationChooserButton.click();
  });

  await test.step('Assert created location on location chooser, log in', async () => {
    await navbar.profileButton.click();
    await navbar.logoutButton.click();
    await loginPage.fillLoginForm(
      AppConfig.instance.users.main.username,
      AppConfig.instance.users.main.password
    );
    await loginPage.loginButton.click();
    await expect(
      locationChooser.getOrganization('1000bulbs.com')
    ).toBeVisible();
    await locationChooser.getOrganization('1000bulbs.com').click();
    await expect(locationChooser.getLocation(depotLocationName)).toBeHidden();
    const location = await mainLocation.getLocation();
    await locationChooser.getLocation(location.name).click();
  });

  await test.step('Delete created location', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Locations').click();
    await locationListPage.searchByLocationNameField.fill(depotLocationName);
    await locationListPage.findButton.click();
    await locationListPage.getLocationToEdit(depotLocationName).click();
    await createLocationPage.actionButton.click();
    await createLocationPage.clickDeleteLocation();
  });

  await test.step('Assert that location does not exists in the list', async () => {
    await locationListPage.searchByLocationNameField.fill(depotLocationName);
    await locationListPage.findButton.click();
    await expect(
      locationListPage.getLocationToEdit(depotLocationName)
    ).toBeHidden();
  });
});
