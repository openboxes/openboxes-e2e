import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class Navbar extends BasePageModel {
  get navbar() {
    // FIXME add a testId or a label to make sure we are targetting a propper navbar
    return this.page.getByRole('navigation');
  }

  get profileButton () {
    // FIXME add labels or testIds
    return this.navbar.getByRole('img').last();
  }

  async isLoaded() {
    await expect(this.navbar).toBeVisible();
  }

}

export default Navbar;
