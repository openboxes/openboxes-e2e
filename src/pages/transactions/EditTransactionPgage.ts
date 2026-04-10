import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import TransactionDetailsHeaderTab from '@/pages/transactions/components/TransactionDetailsHeaderTab';

class EditTransactionPage extends BasePageModel {
  transactionDetailsHeaderTab: TransactionDetailsHeaderTab;

  constructor(page: Page) {
    super(page);
    this.transactionDetailsHeaderTab = new TransactionDetailsHeaderTab(page);
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }
}

export default EditTransactionPage;
