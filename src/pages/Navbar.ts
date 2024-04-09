import { expect, Page } from '@playwright/test';

class Navbar {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get navbar() {
    // FIXME add a testId or a label to make sure we are targetting a propper navbar
    return this.page.getByRole('navigation');
  }

  async isLoaded() {
    await expect(this.navbar).toBeVisible();
  }

}

export default Navbar;
