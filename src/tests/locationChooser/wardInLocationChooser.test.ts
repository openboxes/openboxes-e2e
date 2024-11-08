import LocationChooser from '@/components/LocationChooser';
import Navbar from '@/components/Navbar';
import AppConfig from '@/config/AppConfig';
import { expect, test } from '@/fixtures/fixtures';
import CreateLocationPage from '@/pages/location/createLocation/CreateLocationPage';
import LocationListPage from '@/pages/location/LocationListPage';
import LoginPage from '@/pages/LoginPage';
import EditUserPage from '@/pages/user/editUser/EditUserPage';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Check if ward location is present in location chooser', () => {
  const uniqueIdentifier = new UniqueIdentifier();
  const LOCATION_NAME = uniqueIdentifier.generateUniqueString('test-Ward');

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    const editUserPage = new EditUserPage(page);
    const navbar = new Navbar(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);

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
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();

    const editUserPage = new EditUserPage(page);
    const navbar = new Navbar(page);
    const locationListPage = new LocationListPage(page);
    const createLocationPage = new CreateLocationPage(page);

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
    await page.close();
  });

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
    await navbar.dashboard.click();
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
      locationChooser.getOrganization('No organization')
    ).toBeVisible();
    await locationChooser.getOrganization('No organization').click();
    await expect(
      locationChooser.getLocationGroup('No location Group')
    ).toBeVisible();
    await expect(locationChooser.getLocation(LOCATION_NAME)).toBeVisible();
    await expect(locationChooser.yourLastSingInInfo).toBeVisible();
    await expect(locationChooser.locationChooserLogoutButton).toBeVisible();
  });
});
