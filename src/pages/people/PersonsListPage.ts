import { Locator, Page } from '@playwright/test';

import { expect } from '@/fixtures/fixtures';
import BasePageModel from '@/pages/BasePageModel';

class PersonsListPage extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  async isLoaded() {
    await expect(
      this.page.getByRole('heading').getByText('List Persons')
    ).toBeVisible();
  }

  get addPersonButton() {
    return this.page.getByRole('link', { name: 'Add person' });
  }

  get table() {
    return this.page.getByRole('table');
  }

  get rows() {
    return this.table.getByRole('cell');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  get searchField() {
    return this.page.locator('#q');
  }

  get findButton() {
    return this.page.getByRole('button', { name: 'Find' });
  }

  getPersonToEdit(personFirstName: string) {
    return this.table.getByRole('link', {
      name: personFirstName,
      exact: true,
    });
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }
}

export default PersonsListPage;
