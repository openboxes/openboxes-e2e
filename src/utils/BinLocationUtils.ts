import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import CreateLocationPage from '@/pages/location/createLocation/CreateLocationPage';
import LocationListPage from '@/pages/location/LocationListPage';
import LocationData from '@/utils/LocationData';

class BinLocationUtils {
  static async deactivateReceivingBin({
    mainLocationService,
    locationListPage,
    createLocationPage,
    page,
    receivingBin,
  }: {
    mainLocationService: LocationData;
    locationListPage: LocationListPage;
    createLocationPage: CreateLocationPage;
    page: Page;
    receivingBin: string;
  }) {
    const mainLocation = await mainLocationService.getLocation();
    await page.goto('./location/list');
    await locationListPage.searchByLocationNameField.fill(mainLocation.name);
    await locationListPage.findButton.click();
    await locationListPage.getLocationEditButton(mainLocation.name).click();
    await createLocationPage.binLocationTab.click();
    await createLocationPage.binLocationTabSection.isLoaded();
    await createLocationPage.binLocationTabSection.searchField.fill(
      receivingBin
    );
    await createLocationPage.binLocationTabSection.searchField.press('Enter');
    await createLocationPage.binLocationTabSection.isLoaded();
    await createLocationPage.binLocationTabSection.editBinButton.click();
    await createLocationPage.locationConfigurationTab.click();
    await createLocationPage.locationConfigurationTabSection.activeCheckbox.uncheck();
    await createLocationPage.locationConfigurationTabSection.saveButton.click();
  }
}

export default BinLocationUtils;
