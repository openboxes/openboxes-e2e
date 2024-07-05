import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
import { readFile } from '@/utils/FileIOUtils';

type LocationConfigProps = {
  key: string;
  requiredActivityCodes: Set<ActivityCode>;
  type: LocationTypeCode;
} & (
  | {
      id: string;
      name?: string;
      required: true;
    }
  | {
      id?: string;
      name: string;
      required: false;
    }
);

class LocationConfig {
  id: string;
  name: string;
  requiredActivityCodes: Set<ActivityCode>;
  type: LocationTypeCode;
  required: boolean;
  key: string;

  constructor({
    key,
    id,
    name,
    requiredActivityCodes,
    type,
    required,
  }: LocationConfigProps) {
    this.id = id || '';
    this.name = name || '';
    this.requiredActivityCodes = requiredActivityCodes;
    this.type = type;
    this.required = required ?? false;
    this.key = key;
  }

  /** Should create a new location for testing
   * Indicates if a new location should be created before a test
   * By providing the location id in the .env application will not create a new location
   * and instead will use the provided one
   * @returns {boolean}
   */
  get isCreateNew() {
    return !this.id;
  }

  /**
   * Returns a location Id either from .env if provided or from a file that's created before test run
   * @returns
   */
  readId() {
    if (this.id) {
      return this.id;
    }
    const data = readFile(AppConfig.TEST_DATA_FILE_PATH);
    return _.get(data, `locations.${this.key}`) as string;
  }

  assertAllRequiredActivityCodes(activityCodes: Set<string>) {
    const unexpectedActivities = _.difference(
      [...activityCodes],
      [...this.requiredActivityCodes]
    );
    const absentActivities = _.difference(
      [...this.requiredActivityCodes],
      [...activityCodes]
    );

    // throw an exception if location does not have certain activity codes that are specified as requiredActivityCodes
    if (absentActivities.length > 0) {
      throw new Error(
        `Location "${this.id}" is missing required activity codes: ${[...absentActivities].join(', ')}`
      );
    }

    // throwan exeption if location has activity codes that were not specified as requiredActivityCodes
    if (unexpectedActivities.length > 0) {
      throw new Error(
        `Location "${this.id}" has unexpected activity codes: ${[...unexpectedActivities].join(', ')}`
      );
    }
  }

  assertRequiredLocationType(locationType: string) {
    if (locationType !== this.type) {
      throw new Error(
        `Location "${this.id}" has incorrect type: expected "${this.type}" - got: "${locationType}"`
      );
    }
  }
}

export default LocationConfig;
