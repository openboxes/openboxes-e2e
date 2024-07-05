import BasePageModel from '@/pages/BasePageModel';

class ProductDetailsSection extends BasePageModel {
  get nameField() {
    return this.page
      .getByRole('row')
      .getByRole('textbox', { name: /Product title/ });
  }

  get codeField() {
    return this.page
      .getByRole('row')
      .getByRole('textbox', { name: 'Code', exact: true });
  }

  get categorySelect() {
    return this.page.getByRole('row').locator('#category_id_chosen');
  }

  get categorySelectDropdown() {
    return this.categorySelect.getByRole('list');
  }
}

export default ProductDetailsSection;
