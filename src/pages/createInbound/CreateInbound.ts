import { Page } from '@playwright/test';

import WizzardSteps from '@/components/WizzardSteps';
import BasePageModel from '@/pages/BasePageModel';
import AddItemsStep from '@/pages/createInbound/steps/AddItemsStep';
import CreateStep from '@/pages/createInbound/steps/CreateStep';
import SendStep from '@/pages/createInbound/steps/SendStep';

class CreateInbound extends BasePageModel {
  createStep: CreateStep;
  addItemsStep: AddItemsStep;
  sendStep: SendStep;

  wizzardSteps: WizzardSteps;

  constructor(page: Page) {
    super(page);
    this.createStep = new CreateStep(page);
    this.addItemsStep = new AddItemsStep(page);
    this.sendStep = new SendStep(page);

    const stepNames = ['Create', 'Add items', 'Send'];
    this.wizzardSteps = new WizzardSteps(page, stepNames);
  }

  async goToPage() {
    await this.page.goto('./stockMovement/createInbound?direction=INBOUND');
  }

  get previousButton() {
    return this.page.getByRole('button', { name: 'Previous' });
  }

  get nextButton() {
    return this.page.getByRole('button', { name: 'Next' });
  }
}

export default CreateInbound;
