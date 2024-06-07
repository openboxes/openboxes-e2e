import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class CreateOrganizationPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Create Organization')).toBeVisible();
  }

  get organizationNameField() {
    return this.page.locator('#name');
  }

  get createButton() {
    return this.page.getByRole('button', { name: 'Create' });
  }
}

export default CreateOrganizationPage;
