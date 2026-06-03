import AppConfig from '@/config/AppConfig';
import { DASHBOARD_URL } from '@/constants/applicationUrls';
import { expect, test } from '@/fixtures/fixtures';

test.describe('Assert Putaway exist in menu', () => {
  test('Assert menu content without pick and putaway stock added for location', async ({
    authService,
    page,
    navbar,
  }) => {
    await test.step('Open dashboard', async () => {
      await authService.changeLocation(
        AppConfig.instance.locations.noPickAndPutawayStockDepot.id
      );
      await page.goto(DASHBOARD_URL.base);
    });

    await test.step('Assert content of inbound menu in location with pick and putaway stock', async () => {
      await navbar.inbound.click();
      await expect(navbar.getSectionTitle('Putaways')).toBeHidden();
      await expect(navbar.getNavItem('Create Putaway')).toBeHidden();
      await expect(navbar.getNavItem('List Putaways')).toBeHidden();
    });

    await test.step('Assert content of inventory menu in location with pick and putaway stock', async () => {
      await navbar.inventory.click();
      await expect(
        navbar.getSectionTitle('Inventory Transactions')
      ).toBeVisible();
      await expect(navbar.getNavItem('Transfer stock internally')).toBeHidden();
      await expect(navbar.getNavItem('Replenish picking bins')).toBeHidden();
      await expect(navbar.getNavItem('List Stock Transfers ')).toBeHidden();
    });

    await test.step('Return to main location', async () => {
      await authService.changeLocation(AppConfig.instance.locations.main.id);
    });
  });

  test('Assert menu content when pick and putaway stock added for location', async ({
    authService,
    page,
    navbar,
  }) => {
    await test.step('Open dashboard', async () => {
      await authService.changeLocation(AppConfig.instance.locations.main.id);
      await page.goto(DASHBOARD_URL.base);
    });

    await test.step('Assert content of inbound menu in location with pick and putaway stock', async () => {
      await navbar.inbound.click();
      await expect(navbar.getSectionTitle('Putaways')).toBeVisible();
      await expect(navbar.getNavItem('Create Putaway')).toBeVisible();
      await expect(navbar.getNavItem('List Putaways')).toBeVisible();
    });

    await test.step('Assert content of inventory menu in location with pick and putaway stock', async () => {
      await navbar.inventory.click();
      await expect(
        navbar.getSectionTitle('Inventory Transactions')
      ).toBeVisible();
      await expect(
        navbar.getNavItem('Transfer stock internally')
      ).toBeVisible();
      await expect(navbar.getNavItem('Replenish picking bins')).toBeVisible();
      await expect(navbar.getNavItem('List Stock Transfers ')).toBeVisible();
    });
  });
});
