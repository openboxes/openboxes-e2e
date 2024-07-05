import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
import { readFile } from '@/utils/FileIOUtils';

class LocationConfig {
  id: string;
  name: string;
  requiredActivityCodes: Set<ActivityCode>;
  requiredType: LocationTypeCode;
  required: boolean;
  key: string;

  constructor({
    key,
    id,
    name,
    requiredActivityCodes,
    requiredType,
    required,
  }: {
    id?: string;
    name?: string;
    key: string;
    requiredActivityCodes: Set<ActivityCode>;
    requiredType: LocationTypeCode;
    required?: boolean;
  }) {
    this.id = id || '';
    this.name = name || '';
    this.requiredActivityCodes = requiredActivityCodes;
    this.requiredType = requiredType;
    this.required = required ?? false;
    this.key = key;
  }

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
    if (locationType !== this.requiredType) {
      throw new Error(
        `Location "${this.id}" has incorrect type: expected "${this.requiredType}" - got: "${locationType}"`
      );
    }
  }
}

export default LocationConfig;
