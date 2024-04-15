import { FixtureCallback } from '@/types';
import LocationData from '@/utils/LocationData';

export type LocationDataFixture = {
  mainLocation: LocationData;
  wardLocation: LocationData;
};

export const mainLocation: FixtureCallback<LocationDataFixture> = async (
  { page },
  use
) => {
  await use(new LocationData('main', page.request));
};

export const wardLocation: FixtureCallback<LocationDataFixture> = async (
  { page },
  use
) => {
  await use(new LocationData('ward', page.request));
};
