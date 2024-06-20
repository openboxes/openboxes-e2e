import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class AuditingTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('complementary', { name: 'Auditing' });
  }

  get rows() {
    return this.table.getByRole('row');
  }

  get dateRequestedRow() {
    return this.rows.filter({ hasText: 'Date Requested' })
  }

  get dateShippedRow() {
    return this.rows.filter({ hasText: 'Date Shipped' })
  }

  get dateReceivedRow() {
    return this.rows.filter({ hasText: 'Date Received' })
  }

  get dateCreatedRow() {
    return this.rows.filter({ hasText: 'Date Created' })
  }

  get lastUpdatedRow() {
    return this.rows.filter({ hasText: 'Last Updated' })
  }
}



export default AuditingTable;