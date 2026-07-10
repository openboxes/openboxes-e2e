import { expect, Page } from '@playwright/test';

import WizzardSteps from '@/components/WizzardSteps';
import { PUTAWAY_URL } from '@/constants/applicationUrls';
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
    await this.page.goto(PUTAWAY_URL.create());
  }

  get startPutawayButton() {
    return this.page.getByTestId('start-putaway').nth(0);
  }

  /**
    Clicks "Start Putaway" and returns the id of the pending putaway order
    created by the click, so that the test can delete the putaway via API
    even when it fails before completing it.
  */
  async startPutaway(): Promise<string> {
    const createResponsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/putaways') &&
        response.request().method() === 'POST'
    );
    await this.startPutawayButton.click();
    const createResponse = await createResponsePromise;
    return (await createResponse.json()).data.id;
  }

  get showByStockMovementFilter() {
    return this.page.getByTestId('show-by-button');
  }

  get linesInPendingPutawayFilter() {
    return this.page.getByTestId('custom-select-element');
  }

  get includeLinesInPendingPutawayFilter() {
    return this.page.getByRole('listitem').filter({ hasText: 'Include' });
  }

  get emptyCreatePageInformation() {
    return this.page.locator('.rt-noData').getByText('No rows found');
  }
}

export default CreatePutawayPage;
