import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';
import { UserType } from '@/types';

class CreateUserPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Username')).toBeVisible();
  }

  get usernameField() {
    return this.page.getByRole('textbox', { name: 'username' });
  }

  get firstNameField() {
    return this.page
      .getByRole('row')
      .filter({ hasText: 'First name' })
      .getByRole('textbox');
  }

  get lastNameField() {
    return this.page
      .getByRole('row')
      .filter({ hasText: 'Last name' })
      .getByRole('textbox');
  }

  get passwordField() {
    return this.page.getByRole('textbox', { name: 'password' });
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  async fillUserForm(data: UserType) {
    await this.usernameField.fill(data.username);
    await this.firstNameField.fill(data.firstName);
    await this.lastNameField.fill(data.lastName);
    await this.passwordField.fill(data.password);
  }
}

export default CreateUserPage;
