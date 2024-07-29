import { expect, Page } from '@playwright/test';

import WizzardSteps from '@/components/WizzardSteps';
import BasePageModel from '@/pages/BasePageModel';
import CheckStep from '@/pages/receiving/steps/CheckStep';
import ReceivingStep from '@/pages/receiving/steps/ReceivingStep';

class ReceivingPage extends BasePageModel {
  receivingStep: ReceivingStep;
  checkStep: CheckStep;

  wizzardSteps: WizzardSteps;

  constructor(page: Page) {
    super(page);
    this.receivingStep = new ReceivingStep(page);
    this.checkStep = new CheckStep(page);

    const stepNames = ['Receiving', 'Check'];
    this.wizzardSteps = new WizzardSteps(page, stepNames);
  }

  get previousButton() {
    return this.page.getByRole('button', { name: 'Previous' });
  }

  get nextButton() {
    return this.page.getByRole('button', { name: 'Next' });
  }

  async assertHeaderIsVisible({
    origin,
    destination,
    description,
    date,
  }: {
    origin: string;
    destination: string;
    date: string;
    description: string;
  }) {
    const regexPattern = new RegExp(
      `Receiving | * ${origin} to ${destination}, ${date}, ${description}`
    );
    await expect(this.page.getByText(regexPattern)).toBeVisible();
  }
}

export default ReceivingPage;
