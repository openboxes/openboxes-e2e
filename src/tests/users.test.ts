import { expect, test } from '@/fixtures/fixtures';
import ImpersonateBanner from '@/pages/ImpersonateBanner';
import Navbar from '@/pages/Navbar';
import { UserType } from '@/types';
import AppConfig from '@/utils/AppConfig';

const formData: UserType = {
  username: 'test1',
  firstName: 'test1',
  lastName: 'test1',
  password: 'test1',
};

test.beforeEach(
  async ({ page, navbar, userListPage, createUserPage, editUserPage }) => {
    await page.goto('./dashboard');
    await navbar.configurationButton.click();
    await navbar.getNavItem('Users').click();
    await userListPage.createUserButton.click();
    await createUserPage.fillUserForm(formData);
    await createUserPage.saveButton.click();
    await expect(editUserPage.summary).toContainText(
      `${formData.firstName} ${formData.lastName}`
    );
    await editUserPage.activateUser.click();
    await editUserPage.saveButton.click();
  }
);

test.afterEach(
  async ({
    page,
    navbar,
    loginPage,
    locationChooser,
    editUserPage,
    userListPage,
    mainLocation,
  }) => {
    await navbar.profileButton.click();
    await navbar.logoutButton.click();
    await loginPage.fillLoginForm(
      AppConfig.instance.users.main.username,
      AppConfig.instance.users.main.password
    );
    await loginPage.loginButton.click();
    const location = await mainLocation.getLocation();
    await locationChooser.getLocation(location.name).click();
    await navbar.configurationButton.click();
    await navbar.getNavItem('Users').click();
    await userListPage.searchByNameField.fill(formData.username);
    await userListPage.findButton.click();
    await userListPage.getUserToEdit(formData.username).click();
    await editUserPage.actionButton.click();
    page.on('dialog', (dialog) => dialog.accept());
    await editUserPage.deleteUserButton.click();
    await userListPage.searchByNameField.fill(formData.username);
    await userListPage.findButton.click();
    await expect(userListPage.userListTable).toContainText('No users returned');
  }
);

//tests are covering all steps from test case OBPIH-4622 Users
test('Create user, add default location and auto-login and delete user', async ({
  navbar,
  editUserPage,
  page,
  loginPage,
  mainLocation,
}) => {
  await editUserPage.authorizationTab.click();
  await editUserPage.defaultRoleSelect.click();
  await editUserPage.getUserRole('Manager').click();
  await editUserPage.defaultLocation.click();
  const location = await mainLocation.getLocation();
  await editUserPage.getDefaultLocation(location.name).click();
  await editUserPage.autoLogin.click();
  await editUserPage.saveButton.click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(formData.username, formData.password);
  await loginPage.loginButton.click();
  await expect(page.getByText('My Dashboard')).toBeVisible();
});

test('Create and impersonate user', async ({ editUserPage, page }) => {
  await editUserPage.authorizationTab.click();
  await editUserPage.defaultRoleSelect.click();
  await editUserPage.getUserRole('Manager').click();
  await editUserPage.saveButton.click();
  await editUserPage.impersonateButton.click();
  const newPage = await page.waitForEvent('popup');
  const impersonateBanner = new ImpersonateBanner(newPage);
  await impersonateBanner.isLoaded(formData.username);
  const newPageNavbar = new Navbar(newPage);
  await expect(newPageNavbar.configurationButton).toBeHidden();
  await impersonateBanner.isLoaded(formData.username);
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Purchasing', exact: true })
    .click();
  await newPageNavbar.navbar
    .getByRole('link', { name: 'List Purchase Orders', exact: true })
    .click();
  await impersonateBanner.isLoaded(formData.username);
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Outbound', exact: true })
    .click();
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Create Outbound Movement', exact: true })
    .click();
  await impersonateBanner.isLoaded(formData.username);
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Products', exact: true })
    .click();
  await newPageNavbar.navbar
    .getByRole('link', { name: 'List Products', exact: true })
    .click();
  await impersonateBanner.isLoaded(formData.username);
  await newPage.getByRole('button', { name: 'Logout' }).click();
  await expect(newPage.getByRole('alert')).toBeHidden();
  await newPage.close();
});

test('Create user with no access global permissions', async ({
  navbar,
  userListPage,
  editUserPage,
  loginPage,
  locationChooser,
  mainLocation,
}) => {
  test.setTimeout(3 * 60 * 1000);
  await editUserPage.authorizationTab.click();
  await editUserPage.defaultRoleSelect.click();
  await editUserPage.getUserRole('No access').click();
  await editUserPage.saveButton.click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(formData.username, formData.password);
  await loginPage.loginButton.click();
  await expect(locationChooser.emptyLocationChooser).toBeVisible();
  await locationChooser.locationChooserLogoutButton.click();
  await loginPage.fillLoginForm(
    AppConfig.instance.users.main.username,
    AppConfig.instance.users.main.password
  );
  await loginPage.loginButton.click();
  const location = await mainLocation.getLocation();
  await locationChooser.getLocation(location.name).click();
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.searchByNameField.fill(formData.username);
  await userListPage.findButton.click();
  await userListPage.getUserToEdit(formData.username).click();
  await editUserPage.authorizationTab.click();
  await editUserPage.addLocationRolesButton.click();
  await editUserPage.locationRoleDialog.locationSelectClearButton.click();
  await editUserPage.locationRoleDialog.locationForLocationRoleSelect.click();
  await editUserPage.locationRoleDialog
    .getLocationForLocationRole(location.name)
    .click();
  await editUserPage.locationRoleDialog.locationRoleSelect.click();
  await editUserPage.locationRoleDialog.getUserLocationRole('Manager').click();
  await editUserPage.locationRoleDialog.saveButtonOnLocationRoleDialog.click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(formData.username, formData.password);
  await loginPage.loginButton.click();
  await expect(locationChooser.getLocation(location.name)).toBeVisible();
  await locationChooser.getLocation(location.name).click();
});

test('Create user with requestor permission in non manage inventory depot', async ({
  navbar,
  editUserPage,
  loginPage,
  locationChooser,
  noManageInventoryDepot,
}) => {
  test.setTimeout(3 * 60 * 1000);
  await editUserPage.authorizationTab.click();
  await editUserPage.defaultRoleSelect.click();
  await editUserPage.getUserRole('Admin').click();
  await editUserPage.saveButton.click();
  await editUserPage.addLocationRolesButton.click();
  await editUserPage.locationRoleDialog.locationSelectClearButton.click();
  await editUserPage.locationRoleDialog.locationForLocationRoleSelect.click();
  const location = await noManageInventoryDepot.getLocation();
  await editUserPage.locationRoleDialog
    .getLocationForLocationRole(location.name)
    .click();
  await editUserPage.locationRoleDialog.locationRoleSelect.click();
  await editUserPage.locationRoleDialog
    .getUserLocationRole('Requestor')
    .click();
  await editUserPage.locationRoleDialog.saveButtonOnLocationRoleDialog.click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(formData.username, formData.password);
  await loginPage.loginButton.click();
  await expect(locationChooser.getLocation(location.name)).toBeVisible();
  await locationChooser.getLocation(location.name).click();
});
