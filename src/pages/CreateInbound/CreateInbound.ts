import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import AddItemsStep from '@/pages/CreateInbound/AddItemsStep';
import CreateStep from '@/pages/CreateInbound/CreateStep';
import SendStep from '@/pages/CreateInbound/SendStep';

class CreateInbound extends BasePageModel {
  createStep: CreateStep;
  addItemsStep: AddItemsStep;
  sendStep: SendStep;

  constructor(page: Page) {
    super(page);
    this.createStep = new CreateStep(page);
    this.addItemsStep = new AddItemsStep(page);
    this.sendStep = new SendStep(page);
  }

  async goToPage() {
    await this.page.goto('./stockMovement/createInbound?direction=INBOUND');
  }

  get previousButton() {
    return this.page.getByRole('textbox', { name: 'Previous' });
  }

  get NextButton() {
    return this.page.getByRole('textbox', { name: 'Next' });
  }
}

export default CreateInbound;
