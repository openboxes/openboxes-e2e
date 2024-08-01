import AppConfig from '@/config/AppConfig';
import { test } from '@/fixtures/fixtures';

test('validate data', async ({
  locationService,
  genericService,
  authService,
}) => {
  const defaultTestUser = AppConfig.instance.users['main'];
  const defaultLocation = AppConfig.instance.locations['main'];

  // requires authenticated user before sending requests to the API
  await authService.login({
    username: defaultTestUser.username,
    password: defaultTestUser.password,
  });

  // validate all of the provided location data
  const preconfiguredLocations = Object.values(
    AppConfig.instance.locations
  ).filter((location) => location.required);
  for (const location of preconfiguredLocations) {
    const { data: fetchedLocation } = await locationService.getLocation(
      location.id
    );

    const locationSupportedActivities = new Set<string>(
      fetchedLocation.supportedActivities
    );
    location.assertAllRequiredActivityCodes(locationSupportedActivities);
    location.assertRequiredLocationType(
      fetchedLocation.locationType.locationTypeCode
    );
  }

  // validate all of the provided users logged in to the default location
  for (const user of Object.values(AppConfig.instance.users)) {
    await authService.login({
      username: user.username,
      password: user.password,
      location: defaultLocation.id,
    });
    const { data } = await genericService.getAppContext();

    // eslint-disable-next-line playwright/no-conditional-in-test
    const userGlobalRoles = data?.user?.roles || [];
    // eslint-disable-next-line playwright/no-conditional-in-test
    const currentLocationRoles = data?.currentLocationRoles || [];
    const allUserRoles = new Set([...userGlobalRoles, ...currentLocationRoles]);
    user.assertAllRequiredRoles(allUserRoles);
  }
});
