import LocationService from '@/api/LocationService';
import { FixtureCallback, LocationResponse } from '@/types';
import AppConfig from '@/utils/AppConfig';

export type LocationDataFixture = {
  mainLocation: LocationResponse;
  wardLocation: LocationResponse;
};

export const mainLocation: FixtureCallback<LocationDataFixture> = async (
  { page },
  use
) => {
  const locationService = new LocationService(page.request);
  const { data } = await locationService.getLocation(
    AppConfig.instance.locations['main'].id
  );

  await use(data);
};

export const wardLocation: FixtureCallback<LocationDataFixture> = async (
  { page },
  use
) => {
  const locationService = new LocationService(page.request);
  const { data } = await locationService.getLocation(
    AppConfig.instance.locations['ward'].id
  );

  await use(data);
};
