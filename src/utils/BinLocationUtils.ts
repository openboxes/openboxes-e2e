import { Page } from '@playwright/test';

import { LOCATION_URL } from '@/consts/applicationUrls';
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
    await page.goto(LOCATION_URL.list());
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

  static async createHoldBin({
    mainLocationService,
    locationListPage,
    createLocationPage,
    page,
    holdBinLocationName,
  }: {
    mainLocationService: LocationData;
    locationListPage: LocationListPage;
    createLocationPage: CreateLocationPage;
    page: Page;
    holdBinLocationName: string;
  }) {
    const mainLocation = await mainLocationService.getLocation();
    await page.goto(LOCATION_URL.list());
    await locationListPage.searchByLocationNameField.fill(mainLocation.name);
    await locationListPage.findButton.click();
    await locationListPage.getLocationEditButton(mainLocation.name).click();
    await createLocationPage.binLocationTab.click();
    await createLocationPage.binLocationTabSection.isLoaded();
    await createLocationPage.binLocationTabSection.addBinLocationButton.click();
    await createLocationPage.binLocationTabSection.addBinLocationDialog.binLocationNameField.fill(
      holdBinLocationName
    );
    await createLocationPage.binLocationTabSection.addBinLocationDialog.saveButton.click();
    await createLocationPage.binLocationTab.click();
    await createLocationPage.binLocationTabSection.searchField.fill(
      holdBinLocationName
    );
    await createLocationPage.binLocationTabSection.searchField.press('Enter');
    await createLocationPage.binLocationTabSection.isLoaded();
    await createLocationPage.binLocationTabSection.editBinButton.click();
    await createLocationPage.locationConfigurationTab.click();
    await createLocationPage.locationConfigurationTabSection.useDefaultSettingsCheckbox.uncheck();
    await createLocationPage.locationConfigurationTabSection
      .removeSupportedActivitiesButton('Putaway stock')
      .click();
    await createLocationPage.locationConfigurationTabSection
      .removeSupportedActivitiesButton('Pick stock')
      .click();
    await createLocationPage.locationConfigurationTabSection.supportedActivitiesSelect.click();
    await createLocationPage.locationConfigurationTabSection
      .getSupportedActivitiesOption('Hold stock')
      .click();
    await createLocationPage.locationConfigurationTabSection.saveButton.click();
  }

  static async deactivateCreatedBin({
    mainLocationService,
    locationListPage,
    createLocationPage,
    page,
    binLocationName,
  }: {
    mainLocationService: LocationData;
    locationListPage: LocationListPage;
    createLocationPage: CreateLocationPage;
    page: Page;
    binLocationName: string;
  }) {
    const mainLocation = await mainLocationService.getLocation();
    await page.goto(LOCATION_URL.list());
    await locationListPage.searchByLocationNameField.fill(mainLocation.name);
    await locationListPage.findButton.click();
    await locationListPage.getLocationEditButton(mainLocation.name).click();
    await createLocationPage.binLocationTab.click();
    await createLocationPage.binLocationTabSection.isLoaded();
    await createLocationPage.binLocationTabSection.searchField.fill(
      binLocationName
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
