import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

import TransactionTable from './components/TransactionTable';

class TransactionListPage extends BasePageModel {
  table: TransactionTable;
  constructor(page: Page) {
    super(page);
    this.table = new TransactionTable(page);
  }
}

export default TransactionListPage;
