import { expect, Page } from '@playwright/test';

import WizzardSteps from '@/components/WizzardSteps';
import BasePageModel from '@/pages/BasePageModel';
import StartStep from '@/pages/putaway/steps/StartStep';

import CreatePutawayTable from './components/CreatePutawayTable';
import CompleteStep from './steps/CompleteStep';

class CreatePutawayPage extends BasePageModel {
  startStep: StartStep;
  completeStep: CompleteStep;

  wizzardSteps: WizzardSteps;
  table: CreatePutawayTable;

  constructor(page: Page) {
    super(page);
    this.table = new CreatePutawayTable(page);
    this.startStep = new StartStep(page);
    this.completeStep = new CompleteStep(page);

    const stepNames = ['Start', 'Complete'];
    this.wizzardSteps = new WizzardSteps(page, stepNames);
  }

  async isLoaded() {
    await expect(
      this.page.getByTestId('content-wrap').getByText('Create Putaway')
    ).toBeVisible();
  }

  get startPutawayButton() {
    return this.page.getByTestId('start-putaway').nth(0);
  }
}

export default CreatePutawayPage;
