import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class EditOrganizationPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Edit Organization')).toBeVisible();
  }

  get createOrganizationSuccessMessage() {
    return this.page.getByRole('status', { name: 'message' });
  }

  get deleteOrganizationButton() {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  async clickDeleteOrganization() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteOrganizationButton.click();
  }

  get createOrganizationButton() {
    return this.page.getByText('Add Organization');
  }
}

export default EditOrganizationPage;
