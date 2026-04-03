import { Page } from '@playwright/test';

import Navbar from '@/components/Navbar';

class RefreshCachesUtils {
  static async refreshCaches({ navbar }: { navbar: Navbar; page: Page }) {
    await navbar.profileButton.click();
    await navbar.refreshCachesButton.click();
  }
}

export default RefreshCachesUtils;
