import LocationService from '@/api/LocationService';
import { FixtureCallback } from '@/types';

export type LocationServiceFixture = {
  locationService: LocationService;
};

export const locationService: FixtureCallback<LocationServiceFixture> = async (
  { page },
  use
) => {
  await use(new LocationService(page.request));
};
