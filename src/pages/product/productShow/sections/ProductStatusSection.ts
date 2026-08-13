import BasePageModel from '@/pages/BasePageModel';

class ProductStatusSection extends BasePageModel {
  get lastStockCountDate() {
    return this.page
      .locator('tr.prop')
      .filter({ hasText: 'Last stock count' })
      .locator('p');
  }
}

export default ProductStatusSection;
