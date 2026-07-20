import { expect, Page } from '@playwright/test';

import LocationService from '@/api/LocationService';
import { LOCATION_URL } from '@/constants/applicationUrls';
import CreateLocationPage from '@/pages/location/createLocation/CreateLocationPage';
import LocationListPage from '@/pages/location/LocationListPage';
import LocationData from '@/utils/LocationData';

class BinLocationUtils {
  // Only safe for bins that never went through a completed putaway (e.g. a
  // plain receive, or a putaway that was left pending and deleted): once
  // stock has been putaway out of the bin, product_availability keeps a
  // zero-quantity row until a scheduled refresh job clears it, which can
  // outlast any reasonable test timeout and make the delete fail for a
  // long time. Use deactivateReceivingBin for those cases instead.
  static async deleteReceivingBin({
    locationService,
    mainLocationService,
    receivingBin,
  }: {
    locationService: LocationService;
    mainLocationService: LocationData;
    receivingBin: string;
  }) {
    const binLocation = await BinLocationUtils.findReceivingBin({
      locationService,
      mainLocationService,
      receivingBin,
    });
    if (!binLocation) {
      return;
    }

    await expect
      .poll(async () => locationService.deleteLocation(binLocation.id), {
        message: `Problem deleting receiving bin: ${receivingBin}`,
        timeout: 30_000,
      })
      .toBe(true);
  }

  static async deactivateReceivingBin({
    locationService,
    mainLocationService,
    receivingBin,
  }: {
    locationService: LocationService;
    mainLocationService: LocationData;
    receivingBin: string;
  }) {
    const binLocation = await BinLocationUtils.findReceivingBin({
      locationService,
      mainLocationService,
      receivingBin,
    });
    if (!binLocation) {
      return;
    }

    await locationService.updateLocation(binLocation.id, { active: false });
  }

  private static async findReceivingBin({
    locationService,
    mainLocationService,
    receivingBin,
  }: {
    locationService: LocationService;
    mainLocationService: LocationData;
    receivingBin: string;
  }) {
    const mainLocation = await mainLocationService.getLocation();
    const { data: binLocations } =
      await locationService.searchInternalLocations(
        receivingBin,
        mainLocation.id
      );
    return binLocations.find((bin) => bin.name === receivingBin);
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
