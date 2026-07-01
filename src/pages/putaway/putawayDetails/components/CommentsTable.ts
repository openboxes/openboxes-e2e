import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CommentsTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  async isLoaded() {
    await expect(
      this.page.getByRole('heading').getByText('Comments')
    ).toBeVisible();
  }

  get table() {
    return this.page.getByRole('table').filter({
      hasText: 'Comment',
    });
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  getColumnHeader(columnName: string) {
    return this.table.getByRole('row').getByText(columnName, { exact: true });
  }

  async clickDeleteCommentButton(index: number) {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.row(index).deleteButton.click();
  }

  get emptyCommentTable() {
    return this.page.locator('.fade.center.empty').getByText('No comments');
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get commentContent() {
    return this.row.getByRole('cell').nth(2);
  }

  get recipientContent() {
    return this.row.getByRole('cell').nth(0);
  }

  get senderContent() {
    return this.row.getByRole('cell').nth(1);
  }

  get editButton() {
    return this.row.getByRole('link', { name: 'Edit', exact: true });
  }

  get deleteButton() {
    return this.row.getByRole('link', { name: 'Delete', exact: true });
  }
}

export default CommentsTable;
