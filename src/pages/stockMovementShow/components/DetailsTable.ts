import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class DetailsTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('complementary', { name: 'Details' });
  }

  get rows() {
    return this.table.getByRole('row');
  }

  get identifierRow() {
    return this.rows.filter({ hasText: 'Identifier' });
  }

  get identifierValue() {
    return this.identifierRow.locator('.value');
  }

  get destinationRow() {
    return this.rows.filter({ hasText: 'Destination' });
  }

  get destinationValue() {
    return this.destinationRow.locator('.value');
  }
}

export default DetailsTable;
