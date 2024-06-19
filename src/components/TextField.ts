import FormField from '@/components/FormField';

class TextField extends FormField {
  get textbox() {
    return this.field.getByRole('textbox');
  }

  get numberbox() {
    return this.field.getByRole('spinbutton');
  }
}

export default TextField;
