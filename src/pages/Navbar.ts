import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class Navbar extends BasePageModel {
  get navbar() {
    return this.page.getByRole('navigation', { name: 'main' });
  }

  get locationChooserButton() {
    return this.navbar.getByLabel('location-chooser');
  }

  get profileButton() {
    return this.navbar.getByLabel('profile');
  }

  async isLoaded() {
    await expect(this.navbar).toBeVisible();
  }
}

export default Navbar;
