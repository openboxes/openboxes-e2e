import BasePageModel from '@/pages/BasePageModel';

class ChangePasswordTabSection extends BasePageModel {
  get section() {
    return this.page.getByRole('region', { name: 'Change Password' });
  }

  get saveButton() {
    return this.section.getByRole('button', { name: 'Save' });
  }
}

export default ChangePasswordTabSection;
