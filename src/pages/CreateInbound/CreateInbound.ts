import { Page } from '@playwright/test';

import WizzardStepsComponent from '@/components/WizzardStepsComponent';
import BasePageModel from '@/pages/BasePageModel';
import AddItemsStep from '@/pages/CreateInbound/AddItemsStep';
import CreateStep from '@/pages/CreateInbound/CreateStep';
import SendStep from '@/pages/CreateInbound/SendStep';

class CreateInbound extends BasePageModel {
  createStep: CreateStep;
  addItemsStep: AddItemsStep;
  sendStep: SendStep;

  wizzardSteps: WizzardStepsComponent;

  constructor(page: Page) {
    super(page);
    this.createStep = new CreateStep(page);
    this.addItemsStep = new AddItemsStep(page);
    this.sendStep = new SendStep(page);

    const stepNames = ['Create', 'Add items', 'Send'];
    this.wizzardSteps = new WizzardStepsComponent(page, stepNames)
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
