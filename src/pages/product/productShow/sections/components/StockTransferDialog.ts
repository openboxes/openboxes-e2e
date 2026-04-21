import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class StockTransferDialog extends BasePageModel {
  get stockTransferDialog() {
    return this.page.getByRole('dialog', { name: 'Transfer Stock' });
  }

  async isLoaded() {
    await expect(this.stockTransferDialog).toBeVisible();
  }

  get locationSelect() {
    return this.page.getByRole('cell', { name: 'Choose where stock is being' });
  }

  async selectLocation(locationName: string) {
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
    return this.stockTransferDialog.getByRole('button', {
      name: 'Transfer Stock',
    });
  }
}

export default StockTransferDialog;
