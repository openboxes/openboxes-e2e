import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class WizzardSteps extends BasePageModel {
  steps: Map<string, Locator> = new Map();

  constructor(page: Page, steps: string[]) {
    super(page);
    for (const step of steps) {
      this.steps.set(step, this.createStepLocator(step));
    }
  }

  private createStepLocator(stepName: string) {
    return this.page.getByTestId('wizard-step').filter({ hasText: stepName });
  }

  async assertStepStatus(stepName: string, status: boolean) {
    const stepLocator = this.steps.get(stepName);
    const statusName = status ? 'active' : 'inactive';
    if (!stepLocator) {
      throw new Error(
        'Step does not exist, available steps: ' +
          [...this.steps.keys()].join(',')
      );
    }
    await expect(stepLocator).toHaveAttribute('data-stepstate', statusName);
  }

  async assertActiveStep(step: string) {
    for (const stepName of this.steps.keys()) {
      const stepState = stepName === step;
      this.assertStepStatus(stepName, stepState);
    }
  }
}

export default WizzardSteps;
