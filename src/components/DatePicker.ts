import FormField from '@/components/FormField';

class DatePicker extends FormField {
  get datePickerPopup() {
    return this.page.locator('.react-datepicker');
  }

  get textbox() {
    return this.field.getByRole('textbox');
  }

  async fill(date: Date) {
    const formatedDate = new Intl.DateTimeFormat('en-US').format(date);
    await this.textbox.fill(formatedDate);
    await this.page.keyboard.press('Enter');
  }
}

export default DatePicker;
