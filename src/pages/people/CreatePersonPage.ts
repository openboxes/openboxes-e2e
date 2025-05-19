import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CreatePersonPage extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get createPersonButton() {
    return this.page.getByRole('button', { name: 'Create' });
  }

  get firstNameField() {
    return this.page.getByRole('textbox', { name: 'First Name' });
  }

  get lastNameField() {
    return this.page.getByRole('textbox', { name: 'Last Name' });
  }

  get deletePersonButton() {
    return this.page.getByRole('button', { name: 'Delete' });
  }
}

export default CreatePersonPage;
