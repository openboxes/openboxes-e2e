import {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test';

type TestFixtureProps<T> = T &
  PlaywrightTestArgs &
  PlaywrightTestOptions &
  PlaywrightWorkerArgs &
  PlaywrightWorkerOptions;

/**
 * FIXME: mergeTest workaround
 * We don't have access to util method mergeTests(), this method is only introduced in @1.39.
 * Since we are using node 14 and highes version of playwright
 * that works with this version of node is @1.34,
 * this type should help with exporting fixtures from individual files.
 */
type FixtureCallback<T> = (
  { page }: TestFixtureProps<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use: (arg: any) => Promise<void>
) => Promise<void>;
