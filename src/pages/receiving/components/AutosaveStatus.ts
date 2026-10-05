import { expect, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class AutosaveStatus extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get indicator() {
    return this.page.getByTestId('receiving-autosave-status');
  }

  async isSaved() {
    await expect(this.indicator).toContainText('Your work is auto-saved');
  }

  async isSaving() {
    await expect(this.indicator).toContainText('Your work is being saved');
  }

  async hasError() {
    await expect(this.indicator).toContainText('Your work was not saved');
  }
}

export default AutosaveStatus;
