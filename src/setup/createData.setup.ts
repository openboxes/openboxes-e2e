import AppConfig from '@/config/AppConfig';
import { test } from '@/fixtures/fixtures';
import { readFile, writeToFile } from '@/utils/FileIOUtils';

test('create data', async ({
  locationService,
  mainLocationService,
}) => {
  // eslint-disable-next-line playwright/no-conditional-in-test
  const data = readFile(AppConfig.TEST_DATA_FILE_PATH) || {};

  const seedData: Record<'locations', Record<string, string>> = {
    ...data,
    locations: {},
  };

  // LOCATIONS
  const { organization } = await mainLocationService.getLocation();
  const { data: locationTypes } = await locationService.getLocationTypes();

  const locations = Object.values(AppConfig.instance.locations).filter(
    (location) => location.isCreateNew
  );

  for (const location of locations) {
    await test.step(`create location ${location.key}`, async () => {
      const locationType = locationTypes.find(
        (it) => it.locationTypeCode == location.type
      );
      const payload = {
        active: true,
        name: location.name,
        locationType: locationType,
        organization: { id: organization.id },
        supportedActivities: location.requiredActivityCodes,
      };
      const { data: createdLocation } = await locationService.createLocation(
        payload,
        { useDefaultActivities: true }
      );
      seedData.locations[`${location.key}`] = createdLocation.id;
    });
  }
  writeToFile(AppConfig.TEST_DATA_FILE_PATH, seedData);
});
