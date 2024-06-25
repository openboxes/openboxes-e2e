import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class CreateLocationGroupPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Create Location group')).toBeVisible();
  }

  get locationGroupNameField() {
    return this.page.getByRole('textbox', { name: 'Name' });
  }

  get createButton() {
    return this.page.getByRole('button', { name: 'Create' });
  }
}

export default CreateLocationGroupPage;
