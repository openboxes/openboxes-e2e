import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class EditOrganizationPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Edit Organization')).toBeVisible();
  }

  get createOrganizationSuccessMessage() {
    return this.page.locator('.message');
  }

  get deleteOrganizationButton() {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  async clickDeleteOrganization() {
    await this.deleteOrganizationButton.click();
    //this.page.on('dialog', (dialog) => dialog.accept());
  }

  get createOrganizationButton() {
    return this.page.getByText('Add Organization');
  }
}

export default EditOrganizationPage;
