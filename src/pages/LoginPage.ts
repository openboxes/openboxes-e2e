import BasePageModel from '@/pages/BasePageModel';

class LoginPage extends BasePageModel {
  get emailOrUsernameField() {
    return this.page.getByRole('textbox', { name: 'email or username' });
  }

  get passwordField() {
    return this.page.getByRole('textbox', { name: 'password' });
  }

  get loginButton() {
    return this.page.getByRole('button', { name: 'Login' });
  }

  async goToPage() {
    await this.page.goto('./auth/login');
  }

  async fillLoginForm(username: string, password: string) {
    await this.emailOrUsernameField.fill(username);

    await this.passwordField.fill(password);
  }
}

export default LoginPage;
