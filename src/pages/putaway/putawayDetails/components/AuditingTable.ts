import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class AuditingTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  get orderedByRow() {
    return this.rows.filter({ hasText: 'Ordered By' });
  }

  get orderedByValue() {
    return this.orderedByRow.locator('.value');
  }

  get createdByRow() {
    return this.rows.filter({ hasText: 'Created By' });
  }

  get createdByValue() {
    return this.createdByRow.locator('.value');
  }

  get completedByRow() {
    return this.rows.filter({ hasText: 'Completed By' });
  }

  get completedByValue() {
    return this.completedByRow.locator('.value');
  }

  get updatedByRow() {
    return this.rows.filter({ hasText: 'Updated By' });
  }

  get updateddByValue() {
    return this.updatedByRow.locator('.value');
  }
}

export default AuditingTable;
