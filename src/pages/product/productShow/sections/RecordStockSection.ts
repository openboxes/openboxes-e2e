import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import LineItemsTable from '@/pages/product/productShow/sections/components/LineItemsTable';
import RecordStockTable from '@/pages/product/productShow/sections/components/RecortStockTable';

class RecordStockSection extends BasePageModel {
  lineItemsTable: LineItemsTable;
  recordStockTable: RecordStockTable;

  constructor(page: Page) {
    super(page);
    this.lineItemsTable = new LineItemsTable(page);
    this.recordStockTable = new RecordStockTable(page);
  }
}

export default RecordStockSection;
