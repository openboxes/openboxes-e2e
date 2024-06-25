import BasePageModel from '@/pages/BasePageModel';

class LocationConfigurationTabSection extends BasePageModel {
  get section() {
    return this.page.getByRole('region', { name: 'Configuration' });
  }

  get backgroundColorField() {
    return this.page.getByRole('textbox', { name: 'Background color' });
  }

  get useDefaultSettingsCheckbox() {
    return this.section.getByLabel('Use Default Settings');
  }

  get saveButton() {
    return this.section.getByRole('button', { name: 'Save' });
  }

  get supportedActivities() {
    return this.section.getByTestId('supported-activities-select');
  }

  getSupportedActivities(supportedActivity: string) {
    return this.section
      .getByTestId('supported-activities-select')
      .getByRole('listitem')
      .getByText(supportedActivity, { exact: true });
  }

  removeSupportedActivities(supportedActivity: string) {
    return this.section
      .getByTestId('supported-activities-select')
      .getByRole('listitem')
      .filter({ hasText: supportedActivity })
      .locator('.search-choice-close');
  }
}

export default LocationConfigurationTabSection;
