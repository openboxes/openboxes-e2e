import {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test';

import { LocationTypeCode } from './constants/LocationTypeCode';

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

type ApiResponse<T> = { data: T };

type LocationResponse = {
  id: string;
  name: string;
  locationNumber: string;
  locationGroup: {
    id: string;
    name: string;
  };
  locationType: {
    id: string;
    name: string;
    description: string;
    locationTypeCode: string;
  };
  supportedActivities: string[];
  organization: {
    id: string;
    name: string;
    code: string;
  };
};

type CreateLocationPayload = {
  active: boolean;
  name: string;
  locationType?: LocationType;
  organization: { id: string };
  supportedActivities: string[] | Set<string>;
};

type LocationType = {
  id: string;
  name: string;
  description: string;
  locationTypeCode: LocationTypeCode;
  supportedActivities: string[];
};

type ProductResponse = {
  id: string;
  productCode: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  pricePerUnit?: number;
  color?: string;
  handlingIcons: unknown[];
  lotAndExpiryControl: boolean;
  active: boolean;
  displayNames: unknown;
};

type DemandResponse = {
  totalDemand: number;
  totalDays: number;
  dailyDemand: number;
  monthlyDemand: number;
  onHandMonths: number;
  quantityOnHand: number;
};

type ProductDemandResponse = {
  product: ProductResponse;
  demand: DemandResponse;
};

type UserType = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
};

type AddItemsTableRow = {
  packLevel1: string;
  packLevel2: string;
  productCode: string;
  productName: string;
  lotNumber: string;
  expirationDate: Date;
  quantity: string;
  recipient: string;
};
