import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class EditLocationGroupPage extends BasePageModel {
  async isLoaded() {
    await expect(this.page.getByText('Edit Location group')).toBeVisible();
  }

  get deleteLocationGroupButton() {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  async clickDeleteLocationGroup() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteLocationGroupButton.click();
  }
}

export default EditLocationGroupPage;
