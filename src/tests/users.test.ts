import { expect, test } from '@/fixtures/fixtures';
import ImpersonateBanner from '@/pages/ImpersonateBanner';
import LocationChooser from '@/pages/LocationChooser';
import LoginPage from '@/pages/LoginPage';
import Navbar from '@/pages/Navbar';
import { UserType } from '@/types';

const formData: UserType = {
  username: 'testUser_E2E',
  firstName: 'user_firstanme',
  lastName: 'user_lastname',
  password: 'testpassword123',
};

test.beforeEach(
  async ({ page, navbar, userListPage, createUserPage, editUserPage }) => {
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

    await editUserPage.authorizationTab.click();
  }
);

test.afterEach(async ({ editUserPage, userListPage }) => {
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
    await expect(userListPage.getUserToEdit(formData.username)).toBeHidden();
  });
});

//tests are covering all steps from test case OBPIH-4622 Users
test('Add default location for user and auto-login to location', async ({
  editUserPage,
  mainLocation,
  browser,
}) => {
  await editUserPage.authorizationTabSection.defaultRoleSelect.click();

  await test.step('Select role "Manager"', async () => {
    await editUserPage.authorizationTab.click();
    await editUserPage.authorizationTabSection.defaultRoleSelect.click();
    await editUserPage.authorizationTabSection.getUserRole('Manager').click();
  });

  await test.step('Select default location', async () => {
    await editUserPage.authorizationTabSection.defaultLocationSelect.click();
    const location = await mainLocation.getLocation();
    await editUserPage.authorizationTabSection
      .getDefaultLocation(location.name)
      .click();
  });

  await editUserPage.authorizationTabSection.autoLoginCheckbox.click();
  await editUserPage.authorizationTabSection.saveButton.click();

  const newUserCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const newUserPage = await newUserCtx.newPage();
  const newUserLoginPage = new LoginPage(newUserPage);

  await test.step('Login as new created user', async () => {
    await newUserLoginPage.goToPage();
    await newUserLoginPage.fillLoginForm(formData.username, formData.password);
    await newUserLoginPage.loginButton.click();
  });

  await expect(newUserPage.getByText('My Dashboard')).toBeVisible();
  await newUserCtx.close();
});

test('Impersonate created user', async ({ editUserPage }) => {
  await test.step('Select role "Manager"', async () => {
    await editUserPage.authorizationTabSection.defaultRoleSelect.click();
    await editUserPage.authorizationTabSection.getUserRole('Manager').click();
    await editUserPage.authorizationTabSection.saveButton.click();
  });

  const newPage = await editUserPage.clickImpersonateButton();
  const impersonateBanner = new ImpersonateBanner(newPage);
  const newPageNavbar = new Navbar(newPage);

  await test.step('Check impersonate banner visibility on initial page', async () => {
    await impersonateBanner.isLoaded(formData.username);
    await expect(newPageNavbar.configurationButton).toBeHidden();
  });

  await test.step('Check impersonate banner visibility on list purchase order page', async () => {
    await newPageNavbar.getNavItem('Purchasing').click();
    await newPageNavbar.getNavItem('List Purchase Orders').click();
    await impersonateBanner.isLoaded(formData.username);
  });

  await test.step('Check impersonate banner visibility on create outbound page', async () => {
    await newPageNavbar.getNavItem('Outbound').click();
    await newPageNavbar.getNavItem('Create Outbound Movement').click();
    await impersonateBanner.isLoaded(formData.username);
  });

  await test.step('Check impersonate banner visibility on product list page', async () => {
    await newPageNavbar.getNavItem('Products').click();
    await newPageNavbar.getNavItem('List Products').click();
    await impersonateBanner.isLoaded(formData.username);
  });

  await test.step('Check impersonate banner visibility when logging out of impersonate user', async () => {
    await impersonateBanner.logoutButton.click();
    expect(impersonateBanner.isLoaded(formData.username)).rejects.toThrow();
  });

  await newPage.close();
});

test('Add no access global permissions, edit user and add location role', async ({
  navbar,
  userListPage,
  editUserPage,
  mainLocation,
  browser,
}) => {
  await test.step('Select role "No access"', async () => {
    await editUserPage.authorizationTabSection.defaultRoleSelect.click();
    await editUserPage.authorizationTabSection.getUserRole('No access').click();
    await editUserPage.authorizationTabSection.saveButton.click();
  });

  const useNoAccessRoleCxt = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const useNoAccessRolePage = await useNoAccessRoleCxt.newPage();
  const useNoAccessLoginPage = new LoginPage(useNoAccessRolePage);
  const userNoAccessLocationChooser = new LocationChooser(useNoAccessRolePage);

  await test.step('Login as new created user', async () => {
    await useNoAccessLoginPage.goToPage();
    await useNoAccessLoginPage.fillLoginForm(
      formData.username,
      formData.password
    );
    await useNoAccessLoginPage.loginButton.click();
  });

  await expect(userNoAccessLocationChooser.emptyLocationChooser).toBeVisible();
  await useNoAccessRolePage.close();

  await test.step('Go to user edit page', async () => {
    await navbar.configurationButton.click();
    await navbar.getNavItem('Users').click();
    await userListPage.searchByNameField.fill(formData.username);
    await userListPage.findButton.click();
    await userListPage.getUserToEdit(formData.username).click();
  });

  const location = await mainLocation.getLocation();

  await test.step('Add role "Manager" on "Main location"', async () => {
    await editUserPage.authorizationTab.click();
    await editUserPage.authorizationTabSection.addLocationRolesButton.click();
    await editUserPage.authorizationTabSection.locationRoleDialog.locationSelectClearButton.click();
    await editUserPage.authorizationTabSection.locationRoleDialog.locationForLocationRoleSelect.click();
    await editUserPage.authorizationTabSection.locationRoleDialog
      .getLocationForLocationRole(location.name)
      .click();
    await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
    await editUserPage.authorizationTabSection.locationRoleDialog
      .getUserLocationRole('Manager')
      .click();
    await editUserPage.authorizationTabSection.locationRoleDialog.saveButton.click();
  });

  const userManagerCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const userManagerPage = await userManagerCtx.newPage();
  const userManagerLoginPage = new LoginPage(userManagerPage);
  const userManagerLocationChooser = new LocationChooser(userManagerPage);

  await test.step('Login as new created user', async () => {
    await userManagerLoginPage.goToPage();
    await userManagerLoginPage.fillLoginForm(
      formData.username,
      formData.password
    );
    await userManagerLoginPage.loginButton.click();
  });

  await test.step('Select location in location chooser', async () => {
    await userManagerLocationChooser
      .getOrganization(location.organization?.name)
      .click();
    await userManagerLocationChooser.getLocation(location.name).click();
  });

  await userManagerCtx.close();
});

test('Add requestor permission to non manage inventory depot', async ({
  editUserPage,
  noManageInventoryDepot,
  browser,
}) => {
  await test.step('Select role "Admin"', async () => {
    await editUserPage.authorizationTabSection.defaultRoleSelect.click();
    await editUserPage.authorizationTabSection.getUserRole('Admin').click();
    await editUserPage.authorizationTabSection.saveButton.click();
  });

  const location = await noManageInventoryDepot.getLocation();

  await test.step('Add role "Requestor" on location', async () => {
    await editUserPage.authorizationTabSection.addLocationRolesButton.click();
    await editUserPage.authorizationTabSection.locationRoleDialog.locationSelectClearButton.click();
    await editUserPage.authorizationTabSection.locationRoleDialog.locationForLocationRoleSelect.click();
    await editUserPage.authorizationTabSection.locationRoleDialog
      .getLocationForLocationRole(location.name)
      .click();
    await editUserPage.authorizationTabSection.locationRoleDialog.locationRoleSelect.click();
    await editUserPage.authorizationTabSection.locationRoleDialog
      .getUserLocationRole('Requestor')
      .click();
    await editUserPage.authorizationTabSection.locationRoleDialog.saveButton.click();
  });

  const newUserCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const newUserPage = await newUserCtx.newPage();
  const newUserLoginPage = new LoginPage(newUserPage);
  const newUserLocationChooser = new LocationChooser(newUserPage);

  await test.step('Login as new user', async () => {
    await newUserLoginPage.goToPage();
    await newUserLoginPage.fillLoginForm(formData.username, formData.password);
    await newUserLoginPage.loginButton.click();
  });

  await newUserLocationChooser
    .getOrganization(location.organization?.name)
    .click();
  await expect(newUserLocationChooser.getLocation(location.name)).toBeVisible();
  await newUserLocationChooser.getLocation(location.name).click();
  await newUserCtx.close();
});
