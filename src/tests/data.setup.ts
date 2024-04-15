/* eslint-disable playwright/expect-expect */
import { test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';

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
  for (const location of Object.values(AppConfig.instance.locations)) {
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

    const userGlobalRoles = data?.user?.roles || [];
    const currentLocationRoles = data?.currentLocationRoles || [];
    const allUserRoles = new Set([...userGlobalRoles, ...currentLocationRoles]);
    user.assertAllRequiredRoles(allUserRoles);
  }
});
