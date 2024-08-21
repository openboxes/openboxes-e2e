import FormField from '@/components/FormField';

class DateFilter extends FormField {
  get filter() {
    return this.field.getByTestId('date-filter');
  }

  get datePickerPopup() {
    return this.page.locator('.react-datepicker');
  }

  getMonthDay(day: number) {
    return this.datePickerPopup
      .locator(
        '.react-datepicker__day:not(.react-datepicker__day--outside-month)'
      )
      .getByText(`${day}`, { exact: true });
  }

  async click() {
    await this.filter.click();
  }
}

export default DateFilter;
