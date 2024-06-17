import BasePageModel from '@/pages/BasePageModel';

class CreateStep extends BasePageModel {
  get descriptionField() {
    return this.page.getByRole('textbox', { name: 'Description' });
  }

  get originSelect() {
    return this.page
      .getByTestId('form-field')
      .filter({ hasText: 'Origin' })
      .getByTestId('custom-select-element');
  }

  get destinationSelect() {
    return this.page
      .getByTestId('form-field')
      .filter({ hasText: 'Destination' })
      .getByTestId('custom-select-element');
  }

  get requestedBySelect() {
    return this.page
      .getByTestId('form-field')
      .filter({ hasText: 'Requested By' })
      .getByTestId('custom-select-element');
  }
}

export default CreateStep;
