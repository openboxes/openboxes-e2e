import BasePageModel from '@/pages/BasePageModel';

class UserDetailsTabSection extends BasePageModel {
  get section() {
    return this.page.getByRole('region', { name: 'User Details' });
  }

  get activateUserCheckBox() {
    return this.section.getByRole('checkbox', { name: 'Active' });
  }

  get saveButton() {
    return this.section.getByRole('button', { name: 'Save' });
  }
}

export default UserDetailsTabSection;
