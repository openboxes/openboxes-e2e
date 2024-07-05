import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import LineItemsTable from '@/pages/product/productShow/sections/components/LineItemsTable';

class RecordStockSection extends BasePageModel {
  lineItemsTable: LineItemsTable;

  constructor(page: Page) {
    super(page);
    this.lineItemsTable = new LineItemsTable(page);
  }
}

export default RecordStockSection;
