import { expect, Page } from '@playwright/test';

import { CYCLE_COUNT_URL } from '@/constants/applicationUrls';
import BasePageModel from '@/pages/BasePageModel';
import AllProductsTable from '@/pages/manageCycleCount/components/AllProductsTable';
import ToCountTable from '@/pages/manageCycleCount/components/ToCountTable';

class ManageCycleCountPage extends BasePageModel {
  allProductsTable: AllProductsTable;
  toCountTable: ToCountTable;

  constructor(page: Page) {
    super(page);
    this.allProductsTable = new AllProductsTable(page);
    this.toCountTable = new ToCountTable(page);
  }

  async goToPage() {
    await this.page.goto(CYCLE_COUNT_URL.base);
  }

  async isLoaded() {
    await expect(this.allProductsTab).toBeVisible();
  }

  get tabs() {
    return this.page.locator('.tabs');
  }

  // TABS
  get allProductsTab() {
    return this.tabs.getByRole('button', { name: 'All products', exact: true });
  }

  get toCountTab() {
    return this.tabs.getByRole('button', { name: 'To count', exact: true });
  }

  get toResolveTab() {
    return this.tabs.getByRole('button', { name: 'To resolve', exact: true });
  }

  async openAllProductsTab() {
    await this.openTab(this.allProductsTab, this.allProductsTable);
  }

  async openToCountTab() {
    await this.openTab(this.toCountTab, this.toCountTable);
  }

  async openToResolveTab() {
    await this.openTab(this.toResolveTab, {
      isLoaded: () => expect(this.toResolveTab).toHaveClass('active-tab'),
    });
  }

  // SEARCH
  get searchInput() {
    return this.page.getByPlaceholder('Search...');
  }

  get filterButton() {
    return this.page.getByRole('button', { name: 'Filter', exact: true });
  }

  async searchProduct(productName: string) {
    await this.searchInput.fill(productName);
    await this.filterButton.click();
  }

  // ACTIONS
  get markAsToCountButton() {
    return this.page.getByRole('button', { name: 'Mark as To Count' });
  }

  get startCountButton() {
    return this.page.getByRole('button', { name: 'Start Count' });
  }
}

export default ManageCycleCountPage;
