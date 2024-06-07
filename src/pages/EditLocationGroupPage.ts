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
    await this.deleteLocationGroupButton.click();
    this.page.on('dialog', (dialog) => dialog.accept());
  }
}

export default EditLocationGroupPage;
