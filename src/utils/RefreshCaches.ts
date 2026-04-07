import Navbar from '@/components/Navbar';

class RefreshCachesUtils {
  static async refreshCaches({ navbar }: { navbar: Navbar }) {
    await navbar.profileButton.click();
    await navbar.refreshCachesButton.click();
  }
}

export default RefreshCachesUtils;
