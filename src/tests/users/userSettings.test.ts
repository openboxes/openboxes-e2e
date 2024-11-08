import LocationChooser from '@/components/LocationChooser';
import { expect, test } from '@/fixtures/fixtures';
import LoginPage from '@/pages/LoginPage';
import { CreateUserType } from '@/types';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

let formData: CreateUserType;

const uniqueIdentifier = new UniqueIdentifier();

test.beforeEach(
  async ({ page, navbar, userListPage, createUserPage, editUserPage }) => {
    formData = {
      username: uniqueIdentifier.generateUniqueString('created-user'),
      firstName: 'user_firstanme',
      lastName: 'user_lastname',
      password: 'testpassword123',
    };

    await test.step('Go to create user page', async () => {
      await page.goto('./dashboard');
      await navbar.configurationButton.click();
      await navbar.users.click();
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

test('Add no access global permissions, edit user and add location role', async ({
  editUserPage,
  mainLocationService,
  emptyUserContext,
}) => {
  await test.step('Select role "No access"', async () => {
    await editUserPage.authorizationTabSection.defaultRoleSelect.click();
    await editUserPage.authorizationTabSection.getUserRole('No access').click();
    await editUserPage.authorizationTabSection.saveButton.click();
  });

  const useNoAccessRolePage = await emptyUserContext.newPage();
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

  const location = await mainLocationService.getLocation();

  await test.step('Add role "Manager" on "Main location"', async () => {
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

  await test.step('Select location in location chooser', async () => {
    await useNoAccessLoginPage.goToPage();
    await userNoAccessLocationChooser
      .getOrganization(location.organization?.name)
      .click();
    await userNoAccessLocationChooser.getLocation(location.name).click();
  });
});

test('Add requestor permission to non manage inventory depot', async ({
  editUserPage,
  noManageInventoryDepotService,
  emptyUserContext,
}) => {
  await test.step('Select role "Admin"', async () => {
    await editUserPage.authorizationTabSection.defaultRoleSelect.click();
    await editUserPage.authorizationTabSection.getUserRole('Admin').click();
    await editUserPage.authorizationTabSection.saveButton.click();
  });

  const location = await noManageInventoryDepotService.getLocation();

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

  const newUserPage = await emptyUserContext.newPage();
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
});
