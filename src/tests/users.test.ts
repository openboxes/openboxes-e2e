import { expect, test } from '@/fixtures/fixtures';
import Navbar from '@/pages/Navbar';
import { UserType } from '@/types';
import AppConfig from '@/utils/AppConfig';

test.beforeEach(async ({ page }) => {
  await page.goto('./dashboard');
});

//tests are covering all steps from test case OBPIH-4622 Users
test('Create user, add default location and auto-login and delete user', async ({
  navbar,
  userListPage,
  createUserPage,
  editUserPage,
  page,
  loginPage,
  locationChooser,
  mainLocation,
}) => {
  test.setTimeout(3 * 60 * 1000);
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.createUserButton.click();
  const formData: UserType = {
    username: 'test1',
    firstName: 'test1',
    lastName: 'test1',
    password: 'test1',
  };
  await createUserPage.fillUserForm(formData);
  await createUserPage.saveButton.click();
  await expect(editUserPage.userTitle).toContainText('test1 test1');
  await editUserPage.activateUser.click();
  await editUserPage.saveButton.click();
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
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(
    AppConfig.instance.users.main.username,
    AppConfig.instance.users.main.password
  );
  await loginPage.loginButton.click();
  await locationChooser.getLocation(location.name).click();
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.searchByNameField.fill('test1');
  await userListPage.findButton.click();
  await userListPage.getUserToEdit('test1').click();
  await editUserPage.actionButton.click();
  page.on('dialog', (dialog) => dialog.accept());
  await editUserPage.deleteUserButton.click();
  await userListPage.searchByNameField.fill('test1');
  await userListPage.findButton.click();
  await expect(userListPage.userListTable).toContainText('No users returned');
});

test('Create and impersonate user', async ({
  navbar,
  userListPage,
  createUserPage,
  editUserPage,
  page,
}) => {
  test.setTimeout(3 * 60 * 1000);
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.createUserButton.click();
  const formData: UserType = {
    username: 'test2',
    firstName: 'test2',
    lastName: 'test2',
    password: 'test2',
  };
  await createUserPage.fillUserForm(formData);
  await createUserPage.saveButton.click();
  await expect(editUserPage.userTitle).toContainText('test2 test2');
  await editUserPage.activateUser.click();
  await editUserPage.saveButton.click();
  await editUserPage.authorizationTab.click();
  await editUserPage.defaultRoleSelect.click();
  await editUserPage.getUserRole('Manager').click();
  await editUserPage.saveButton.click();
  await editUserPage.impersonateButton.click();
  const newPage = await page.waitForEvent('popup');
  await expect(newPage.getByRole('alert')).toContainText(
    'You are impersonating user test2'
  );
  const newPageNavbar = new Navbar(newPage);
  await expect(newPageNavbar.configurationButton).toBeHidden();
  await expect(newPage.getByRole('alert')).toContainText(
    'You are impersonating user test2'
  );
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Purchasing', exact: true })
    .click();
  await newPageNavbar.navbar
    .getByRole('link', { name: 'List Purchase Orders', exact: true })
    .click();
  await expect(newPage.getByRole('alert')).toContainText(
    'You are impersonating user test2'
  );
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Outbound', exact: true })
    .click();
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Create Outbound Movement', exact: true })
    .click();
  await expect(newPage.getByRole('alert')).toContainText(
    'You are impersonating user test2'
  );
  await newPageNavbar.navbar
    .getByRole('link', { name: 'Products', exact: true })
    .click();
  await newPageNavbar.navbar
    .getByRole('link', { name: 'List Products', exact: true })
    .click();
  await expect(newPage.getByRole('alert')).toContainText(
    'You are impersonating user test2'
  );
  await newPage.getByRole('button', { name: 'Logout' }).click();
  await expect(newPage.getByRole('alert')).toBeHidden();
  await newPage.close();
  await editUserPage.actionButton.click();
  page.on('dialog', (dialog) => dialog.accept());
  await editUserPage.deleteUserButton.click();
  await userListPage.searchByNameField.fill('test2');
  await userListPage.findButton.click();
  await expect(userListPage.userListTable).toContainText('No users returned');
});

test('Create user with no access global permissions', async ({
  navbar,
  userListPage,
  createUserPage,
  editUserPage,
  loginPage,
  locationChooser,
  page,
  mainLocation,
}) => {
  test.setTimeout(3 * 60 * 1000);
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.createUserButton.click();
  const formData: UserType = {
    username: 'test3',
    firstName: 'test3',
    lastName: 'test3',
    password: 'test3',
  };
  await createUserPage.fillUserForm(formData);
  await createUserPage.saveButton.click();
  await expect(editUserPage.userTitle).toContainText('test3 test3');
  await editUserPage.activateUser.click();
  await editUserPage.saveButton.click();
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
  await userListPage.searchByNameField.fill('test3');
  await userListPage.findButton.click();
  await userListPage.getUserToEdit('test3').click();
  await editUserPage.authorizationTab.click();
  await editUserPage.addLocationRolesButton.click();
  await editUserPage.locationSelectClearButton.click();
  await editUserPage.locationForLocationRoleSelect.click();
  await editUserPage.getLocationForLocationRole(location.name).click();
  await editUserPage.locationRoleSelect.click();
  await editUserPage.getUserLocationRole('Manager').click();
  await editUserPage.saveButtonOnLocationRoleDialog.click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(formData.username, formData.password);
  await loginPage.loginButton.click();
  await expect(locationChooser.getLocation(location.name)).toBeVisible();
  await locationChooser.getLocation(location.name).click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(
    AppConfig.instance.users.main.username,
    AppConfig.instance.users.main.password
  );
  await loginPage.loginButton.click();
  await locationChooser.getLocation(location.name).click();
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.searchByNameField.fill('test3');
  await userListPage.findButton.click();
  await userListPage.getUserToEdit('test3').click();
  await editUserPage.actionButton.click();
  page.on('dialog', (dialog) => dialog.accept());
  await editUserPage.deleteUserButton.click();
  await userListPage.searchByNameField.fill('test3');
  await userListPage.findButton.click();
  await expect(userListPage.userListTable).toContainText('No users returned');
});

test('Create user with requestor permission in non manage inventory depot', async ({
  navbar,
  userListPage,
  createUserPage,
  editUserPage,
  loginPage,
  locationChooser,
  page,
  mainLocation,
  noManageInventoryDepot,
}) => {
  test.setTimeout(3 * 60 * 1000);
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.createUserButton.click();
  const formData: UserType = {
    username: 'test4',
    firstName: 'test4',
    lastName: 'test4',
    password: 'test4',
  };
  await createUserPage.fillUserForm(formData);
  await createUserPage.saveButton.click();
  await expect(editUserPage.userTitle).toContainText('test4 test4');
  await editUserPage.activateUser.click();
  await editUserPage.saveButton.click();
  await editUserPage.authorizationTab.click();
  await editUserPage.defaultRoleSelect.click();
  await editUserPage.getUserRole('Superuser').click();
  await editUserPage.saveButton.click();
  await editUserPage.addLocationRolesButton.click();
  await editUserPage.locationSelectClearButton.click();
  await editUserPage.locationForLocationRoleSelect.click();
  const locationMain = await mainLocation.getLocation();
  const location = await noManageInventoryDepot.getLocation();
  await editUserPage.getLocationForLocationRole(location.name).click();
  await editUserPage.locationRoleSelect.click();
  await editUserPage.getUserLocationRole('Requestor').click();
  await editUserPage.saveButtonOnLocationRoleDialog.click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(formData.username, formData.password);
  await loginPage.loginButton.click();
  await expect(locationChooser.getLocation(location.name)).toBeVisible();
  await locationChooser.getLocation(location.name).click();
  await navbar.profileButton.click();
  await navbar.logoutButton.click();
  await loginPage.fillLoginForm(
    AppConfig.instance.users.main.username,
    AppConfig.instance.users.main.password
  );
  await loginPage.loginButton.click();
  await locationChooser.getLocation(locationMain.name).click();
  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();
  await userListPage.searchByNameField.fill('test4');
  await userListPage.findButton.click();
  await userListPage.getUserToEdit('test4').click();
  await editUserPage.actionButton.click();
  page.on('dialog', (dialog) => dialog.accept());
  await editUserPage.deleteUserButton.click();
  await userListPage.searchByNameField.fill('test4');
  await userListPage.findButton.click();
  await expect(userListPage.userListTable).toContainText('No users returned');
});
