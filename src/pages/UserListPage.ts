import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class UserListPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Users')).toBeVisible();
  }

  get createUserButton() {
    return this.page.getByText('Create User');
  }

  get searchByNameField() {
    return this.page.getByRole('textbox', { name: 'filter-by-name' });
  }

  get findButton() {
    return this.page.getByRole('button', { name: 'Find' });
  }

  get userListTable() {
    return this.page.getByRole('table');
  }

  getUserToEdit(username: string) {
    return this.page.getByRole('link').getByText(username);
  }
}

export default UserListPage;
