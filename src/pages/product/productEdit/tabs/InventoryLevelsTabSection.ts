import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import CreateStockLevelModal from '@/pages/product/productEdit/components/createStockLevelModal';

class InventoryLevelsTabSection extends BasePageModel {
  createStockLevelModal: CreateStockLevelModal;

  constructor(page: Page) {
    super(page);
    this.createStockLevelModal = new CreateStockLevelModal(page);
  }

  get createStockLevelButton() {
    return this.page.getByRole('link', { name: 'Create stock level' });
  }

  get table() {
    return this.page.locator('#ui-tabs-3').getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get editInventoryLevelButton() {
    return this.row
      .getByRole('cell')
      .locator('a.btn-show-dialog', { hasText: 'Edit' });
  }
}

export default InventoryLevelsTabSection;
