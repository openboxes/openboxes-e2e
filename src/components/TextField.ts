import FormField from '@/components/FormField';

class TextField extends FormField {
  get textbox() {
    return this.field.getByRole('textbox');
  }
}

export default TextField;
