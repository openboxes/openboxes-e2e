import FormField from '@/components/FormField';
import { formatDate } from '@/utils/DateUtils';

class DatePicker extends FormField {
  get datePickerPopup() {
    return this.page.locator('.react-datepicker');
  }

  get textbox() {
    return this.field.getByRole('textbox');
  }

  async fill(date: Date) {
    await this.textbox.fill(formatDate(date));
    await this.page.keyboard.press('Enter');
  }

  async fillWithFormat(date: Date, format: string) {
    await this.page.waitForTimeout(1000);
    await this.textbox.fill(formatDate(date, format));
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }
}

export default DatePicker;
