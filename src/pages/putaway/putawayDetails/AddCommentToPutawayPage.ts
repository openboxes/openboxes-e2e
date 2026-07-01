import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class AddCommentToPutawayPage extends BasePageModel {
  async isLoaded() {
    await expect(
      this.page.getByRole('heading', { name: 'Add Comment' })
    ).toBeVisible();
  }

  get commentField() {
    return this.page.locator('#comment');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  get recipientDropdown() {
    return this.page.locator('#recipient_id_chosen .chosen-single');
  }

  get recipientOptions() {
    return this.page.locator('#recipient_id_chosen .chosen-results li');
  }

  async selectRecipient(name: string) {
    await this.recipientDropdown.click();

    await this.recipientOptions.filter({ hasText: name }).click();
  }

  get senderName() {
    return this.page
      .locator('tr.prop')
      .filter({ hasText: 'From' })
      .locator('td.value');
  }
}

export default AddCommentToPutawayPage;
