import { expect } from '@playwright/test';

import FormField from '@/components/FormField';
import { formatDate } from '@/utils/DateUtils';

const ordinal = (day: number) => {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return `${day}th`;
  }
  return `${day}${{ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th'}`;
};

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

  /**
    For date fields that open a calendar instead of taking typed input (the
    field itself is a button). Picks the day in the calendar, which keeps the
    time that was selected before.
  */
  async selectDate(date: Date) {
    await this.field.getByRole('button').first().click();
    await expect(this.page.getByRole('option').first()).toBeVisible();
    // e.g. "Choose Saturday, October 10th, 2026"
    const day = this.page.getByRole('option', {
      name: `Choose ${formatDate(date, 'dddd, MMMM')} ${ordinal(
        date.getDate()
      )}, ${date.getFullYear()}`,
    });
    // the calendar opens on the selected month, so move to the month of the
    // date when it isn't shown (days of the neighbouring months are listed too)
    if (!(await day.isVisible())) {
      const monthButton = date > new Date() ? 'Next Month' : 'Previous Month';
      await this.page.getByRole('button', { name: monthButton }).click();
    }
    await day.click();
  }

  // fields that don't show the error under them show it in a tooltip on hover
  async assertErrorTooltip(message: string) {
    await this.field.hover();
    await expect(
      this.page.getByRole('tooltip').getByText(message)
    ).toBeVisible();
  }

  async fillWithFormat(date: Date, format: string) {
    // TODO: This is temporary solution until we figure out the sluggishness of the date picker
    await this.page.waitForTimeout(1000);
    await this.textbox.fill(formatDate(date, format));
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }
}

export default DatePicker;
