import { expect, test } from '@/fixtures/fixtures';
import ImpersonateBanner from '@/pages/ImpersonateBanner';
import LocationChooser from '@/pages/LocationChooser';
import LoginPage from '@/pages/LoginPage';
import Navbar from '@/pages/Navbar';
import { UserType } from '@/types';

const formData: UserType = {
  username: 'user_user_testcases',
  firstName: 'user_firstanme',
  lastName: 'user_lastname',
  password: 'testpassword123',
};

//create and activate user
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
    await editUserPage.userDetailsTabSection.activateUserCheckBox.click();
    await editUserPage.userDetailsTabSection.saveButton.click();
  }
);

//delete created user
test.afterEach(async ({ editUserPage, userListPage }) => {
  await userListPage.goToPage();
  await userListPage.searchByNameField.fill(formData.username);
  await userListPage.findButton.click();
  await userListPage.getUserToEdit(formData.username).click();
  await editUserPage.actionButton.click();
  await editUserPage.clickDeleteUser();
  await userListPage.searchByNameField.fill(formData.username);
  await userListPage.findButton.click();
  await expect(userListPage.userListTable).toContainText('No users returned');
});

//tests are covering all steps from test case OBPIH-4622 Users
test('Add default location for user and auto-login to location', async ({
  editUserPage,
  mainLocation,
  browser,
}) => {
  await editUserPage.authorizationTab.click();
  await editUserPage.authorizationTabSection.defaultRoleSelect.click();
  await editUserPage.authorizationTabSection.getUserRole('Manager').click();
  await editUserPage.authorizationTabSection.defaultLocationSelect.click();
  const location = await mainLocation.getLocation();
  await editUserPage.authorizationTabSection
    .getDefaultLocation(location.name)
    .click();
  await editUserPage.authorizationTabSection.autoLoginCheckbox.click();
  await editUserPage.authorizationTabSection.saveButton.click();

  const newUserCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const newUserPage = await newUserCtx.newPage();
  const newUserLoginPage = new LoginPage(newUserPage);
  await newUserLoginPage.goToPage();
  await newUserLoginPage.fillLoginForm(formData.username, formData.password);
  await newUserLoginPage.loginButton.click();

  await expect(newUserPage.getByText('My Dashboard')).toBeVisible();
  await newUserCtx.close();
});

test('Impersonate created user', async ({ editUserPage }) => {
  await editUserPage.authorizationTab.click();
  await editUserPage.authorizationTabSection.defaultRoleSelect.click();
  await editUserPage.authorizationTabSection.getUserRole('Manager').click();
  await editUserPage.authorizationTabSection.saveButton.click();

  const newPage = await editUserPage.clickImpersonateButton();
  const impersonateBanner = new ImpersonateBanner(newPage);
  await impersonateBanner.isLoaded(formData.username);
  const newPageNavbar = new Navbar(newPage);
  await expect(newPageNavbar.configurationButton).toBeHidden();
  await impersonateBanner.isLoaded(formData.username);
  await newPageNavbar.getNavItem('Purchasing').click();
  await newPageNavbar.getNavItem('List Purchase Orders').click();
  await impersonateBanner.isLoaded(formData.username);
  await newPageNavbar.getNavItem('Outbound').click();
  await newPageNavbar.getNavItem('Create Outbound Movement').click();
  await impersonateBanner.isLoaded(formData.username);
  await newPageNavbar.getNavItem('Products').click();
  await newPageNavbar.getNavItem('List Products').click();
  await impersonateBanner.isLoaded(formData.username);
  await impersonateBanner.logoutButton.click();
  expect(impersonateBanner.isLoaded(formData.username)).rejects.toThrow();
  await newPage.close();
});

test('Add no access global permissions, edit user and add location role', async ({
  navbar,
  userListPage,
  editUserPage,
  mainLocation,
  browser,
}) => {
  await editUserPage.authorizationTab.click();
  await editUserPage.authorizationTabSection.defaultRoleSelect.click();
  await editUserPage.authorizationTabSection.getUserRole('No access').click();
  await editUserPage.authorizationTabSection.saveButton.click();

  const useNoAccessRoleCxt = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const useNoAccessRolePage = await useNoAccessRoleCxt.newPage();
  const useNoAccessLoginPage = new LoginPage(useNoAccessRolePage);
  const userNoAccessLocationChooser = new LocationChooser(useNoAccessRolePage);
  await useNoAccessLoginPage.goToPage();
  await useNoAccessLoginPage.fillLoginForm(
    formData.username,
    formData.password
  );
  await useNoAccessLoginPage.loginButton.click();
  await expect(userNoAccessLocationChooser.emptyLocationChooser).toBeVisible();
  await useNoAccessRolePage.close();

  await navbar.configurationButton.click();
  await navbar.getNavItem('Users').click();

  await userListPage.searchByNameField.fill(formData.username);
  await userListPage.findButton.click();
  await userListPage.getUserToEdit(formData.username).click();
  await editUserPage.authorizationTab.click();
  await editUserPage.authorizationTabSection.addLocationRolesButton.click();
  await editUserPage.authorizationTabSection.locationRoleDialog.locationSelectClearButton.click();
  await editUserPage.authorizationTabSection.locationRoleDialog.locationForLocationRoleSelect.click();

  const location = await mainLocation.getLocation();
  await editUserPage.authorizationTabSection.locationRoleDialog
    .getLocationForLocationRole(location.name)
    .click();
  await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
  await editUserPage.authorizationTabSection.locationRoleDialog
    .getUserLocationRole('Manager')
    .click();
  await editUserPage.authorizationTabSection.locationRoleDialog.saveButtonOnLocationRoleDialog.click();

  const userManagerCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const userManagerPage = await userManagerCtx.newPage();
  const userManagerLoginPage = new LoginPage(userManagerPage);
  const userManagerLocationChooser = new LocationChooser(userManagerPage);
  await userManagerLoginPage.goToPage();
  await userManagerLoginPage.fillLoginForm(
    formData.username,
    formData.password
  );
  await userManagerLoginPage.loginButton.click();

  await userManagerLocationChooser
    .getOrganization(location.organization?.name)
    .click();

  await userManagerLocationChooser.getLocation(location.name).click();
  await userManagerCtx.close();
});

test('Add requestor permission to non manage inventory depot', async ({
  editUserPage,
  noManageInventoryDepot,
  browser,
}) => {
  await editUserPage.authorizationTab.click();
  await editUserPage.authorizationTabSection.defaultRoleSelect.click();
  await editUserPage.authorizationTabSection.getUserRole('Admin').click();
  await editUserPage.authorizationTabSection.saveButton.click();
  await editUserPage.authorizationTabSection.addLocationRolesButton.click();
  await editUserPage.authorizationTabSection.locationRoleDialog.locationSelectClearButton.click();
  await editUserPage.authorizationTabSection.locationRoleDialog.locationForLocationRoleSelect.click();
  const location = await noManageInventoryDepot.getLocation();
  await editUserPage.authorizationTabSection.locationRoleDialog
    .getLocationForLocationRole(location.name)
    .click();
  await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
  await editUserPage.authorizationTabSection.locationRoleDialog
    .getUserLocationRole('Requestor')
    .click();
  await editUserPage.authorizationTabSection.locationRoleDialog.saveButtonOnLocationRoleDialog.click();

  const newUserCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const newUserPage = await newUserCtx.newPage();
  const newUserLoginPage = new LoginPage(newUserPage);
  const newUserLocationChooser = new LocationChooser(newUserPage);
  await newUserLoginPage.goToPage();
  await newUserLoginPage.fillLoginForm(formData.username, formData.password);
  await newUserLoginPage.loginButton.click();

  await newUserLocationChooser
    .getOrganization(location.organization?.name)
    .click();
  await expect(newUserLocationChooser.getLocation(location.name)).toBeVisible();
  await newUserLocationChooser.getLocation(location.name).click();
  await newUserCtx.close();
});
