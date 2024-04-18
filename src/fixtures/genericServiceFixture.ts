import GenericService from '@/api/GenericService';
import { FixtureCallback } from '@/types';

export type GenericServiceFixture = {
  genericService: GenericService;
};

export const genericService: FixtureCallback<GenericServiceFixture> = async (
  { page },
  use
) => {
  await use(new GenericService(page.request));
};
