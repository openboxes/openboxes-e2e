import ImpersonateBanner from '@/components/ImpersonateBanner';
import Navbar from '@/components/Navbar';
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

//tests are covering all steps from test case OBPIH-4622 Users
test('Add default location for user and auto-login to location', async ({
  editUserPage,
  mainLocationService,
  emptyUserContext,
}) => {
  await editUserPage.authorizationTabSection.defaultRoleSelect.click();

  await test.step('Select role "Manager"', async () => {
    await editUserPage.authorizationTab.click();
    await editUserPage.authorizationTabSection.defaultRoleSelect.click();
    await editUserPage.authorizationTabSection.getUserRole('Manager').click();
  });

  await test.step('Select default location', async () => {
    await editUserPage.authorizationTabSection.defaultLocationSelect.click();
    const location = await mainLocationService.getLocation();
    await editUserPage.authorizationTabSection
      .getDefaultLocation(location.name)
      .click();
  });

  await editUserPage.authorizationTabSection.autoLoginCheckbox.click();
  await editUserPage.authorizationTabSection.saveButton.click();

  const newUserPage = await emptyUserContext.newPage();
  const newUserLoginPage = new LoginPage(newUserPage);

  await test.step('Login as new created user', async () => {
    await newUserLoginPage.goToPage();
    await newUserLoginPage.fillLoginForm(formData.username, formData.password);
    await newUserLoginPage.loginButton.click();
  });

  await expect(newUserPage.getByText('My Dashboard')).toBeVisible();
});

// TODO: OBPIH-6909 Fix menu clicking when impersonating users
test.skip('Impersonate created user', async ({ editUserPage }) => {
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
    await newPageNavbar.purchasing.click();
    await newPageNavbar.listPurchaseOrders.click();
    await impersonateBanner.isLoaded(formData.username);
  });

  await test.step('Check impersonate banner visibility on create outbound page', async () => {
    await newPageNavbar.outbound.click();
    await newPageNavbar.createOutboundMovement.click();
    await impersonateBanner.isLoaded(formData.username);
  });

  await test.step('Check impersonate banner visibility on product list page', async () => {
    await newPageNavbar.products.click();
    await newPageNavbar.listProducts.click();
    await impersonateBanner.isLoaded(formData.username);
  });

  await test.step('Check impersonate banner visibility when logging out of impersonate user', async () => {
    await impersonateBanner.logoutButton.click();
    expect(impersonateBanner.isLoaded(formData.username)).rejects.toThrow();
  });

  await newPage.close();
});
