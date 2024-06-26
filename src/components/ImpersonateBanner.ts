import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class ImpersonateBanner extends BasePageModel {
  get banner() {
    return this.page.getByRole('alert', { name: 'impersonate' });
  }

  get logoutButton() {
    return this.banner.getByRole('button', { name: 'Logout' });
  }

  async isLoaded(username: string) {
    await expect(this.banner).toContainText(username);
  }
}

export default ImpersonateBanner;
