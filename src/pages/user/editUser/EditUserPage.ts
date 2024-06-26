import { Page } from '@playwright/test';

import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';
import AuthorizationTabSection from '@/pages/user/editUser/tabs/AuthorizationTabSection';
import ChangePasswordTabSection from '@/pages/user/editUser/tabs/ChangePasswordTabSection';
import UserDetailsTabSection from '@/pages/user/editUser/tabs/UserDetailsTabSection';

class EditUserPage extends BasePageModel {
  userDetailsTabSection: UserDetailsTabSection;
  changePasswordTabSection: ChangePasswordTabSection;
  authorizationTabSection: AuthorizationTabSection;

  constructor(page: Page) {
    super(page);
    this.userDetailsTabSection = new UserDetailsTabSection(page);
    this.changePasswordTabSection = new ChangePasswordTabSection(page);
    this.authorizationTabSection = new AuthorizationTabSection(page);
  }
  async isLoaded() {
    await expect(this.page.locator('title')).toBeVisible();
  }

  get summary() {
    return this.page.getByRole('region', { name: 'summary' });
  }

  get actionButton() {
    return this.page.getByRole('button', { name: 'action' });
  }

  get deleteUserButton() {
    return this.page.getByRole('menuitem').filter({ hasText: 'Delete User' });
  }

  get authorizationTab() {
    return this.page.getByRole('tab', { name: 'Authorization' });
  }

  get impersonateButton() {
    return this.page.getByRole('link', { name: 'Impersonate' });
  }

  async clickImpersonateButton() {
    const popupPromise = this.page.waitForEvent('popup');
    await this.impersonateButton.click();
    const newPage = await popupPromise;
    await newPage.waitForLoadState();
    return newPage;
  }

  async clickDeleteUser() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteUserButton.click();
  }
}

export default EditUserPage;
