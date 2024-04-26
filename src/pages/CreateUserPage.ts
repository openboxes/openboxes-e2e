import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class CreateUserPage extends BasePageModel {
    async isLoaded() {
        await expect(this.page.getByText('Username')).toBeVisible();
      }

      get username() {
        return this.page.getByRole('textbox', { name: 'username' });
      }

      get firstName() {
        return this.page.getByRole('row').filter({ hasText: 'First name' }).getByRole('textbox');
      }

      get lastName() {
        return this.page.getByRole('row').filter({ hasText: 'Last name' }).getByRole('textbox');
      }

      get password() {
        return this.page.getByRole('textbox', { name: 'password' });
      }

      get saveButton() {
        return this.page.getByRole('button', {name: 'Save'});
      }
  
  }
  
  export default CreateUserPage;