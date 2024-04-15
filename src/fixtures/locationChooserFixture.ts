import LocationChooser from '@/pages/LocationChooser';
import { FixtureCallback } from '@/types';

export type LocationChooserFixture = {
  locationChooser: LocationChooser;
};

export const locationChooser: FixtureCallback<LocationChooserFixture> = async (
  { page },
  use
) => {
  await use(new LocationChooser(page));
};
