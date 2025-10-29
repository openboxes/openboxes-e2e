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

  async goToPage() {
    await this.page.goto('./putAway/create');
  }

  get startPutawayButton() {
    return this.page.getByTestId('start-putaway').nth(0);
  }

  get showByStockMovementFilter() {
    return this.page.getByTestId('show-by-button');
  }

  get linesInPendingPutawayFilter() {
    return this.page
      .locator('#select-id_1 div')
      .filter({ hasText: 'Exclude' })
      .nth(1);
  }

  get includeLinesInPedningPutawayFilter() {
    return this.page.getByRole('listitem').filter({ hasText: 'Include' });
  }

  get emptyCreatePageInformation() {
    return this.page.locator('.rt-noData').getByText('No rows found');
  }
}

export default CreatePutawayPage;
