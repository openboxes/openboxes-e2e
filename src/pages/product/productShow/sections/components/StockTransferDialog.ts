import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class StockTransferDialog extends BasePageModel {
  
  async isLoaded() {
    await expect(
      this.page.getByRole('dialog', { name: 'Transfer Stock' })
    ).toBeVisible();
  }

  get locationSelect() {
    return this.page.getByRole('cell', { name: 'Choose where stock is being' });
  }

  async getLocation(locationName: string) {
    const activeDropdown = this.page.locator(
      '.chosen-container-active .chosen-results'
    );

    await activeDropdown.waitFor();

    return activeDropdown.locator('li', { hasText: locationName }).click();
  }

  get binLocationSelect() {
    return this.page.getByRole('cell', { name: 'Select an Option' });
  }

  get transferStockButton() {
    return this.page
      .getByRole('dialog', { name: 'Transfer Stock' })
      .getByRole('button', { name: 'Transfer Stock' });
  }
}

export default StockTransferDialog;
