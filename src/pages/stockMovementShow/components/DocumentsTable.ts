import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class DocumentsListTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page
      .getByRole('region', { name: 'Documents' })
      .getByRole('table');
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

  get downloadButton() {
    return this.row.getByRole('link', { name: 'Download' });
  }

  getDocumentName(documentName: string) {
    return this.row.getByRole('cell', { name: documentName });
  }
}

export default DocumentsListTable;
