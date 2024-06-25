import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class CreateOrganizationPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Create Organization')).toBeVisible();
  }

  async goToPage() {
    await this.page.goto('./organization/create');
  }

  get organizationNameField() {
    return this.page.getByRole('textbox', { name: 'Name' });
  }

  get createButton() {
    return this.page.getByRole('button', { name: 'Create' });
  }
}

export default CreateOrganizationPage;
